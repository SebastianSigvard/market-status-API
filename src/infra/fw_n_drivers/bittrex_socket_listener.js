import EventEmitter from 'events';
import logger from '../../logger.js';
import crypto from 'crypto';
const DEFAULT_WATCHDOG_PERIOD = 600000;

/**
 * Class that handels websocket connection to bittrex api, allowing
 * you to suscribe to multiples streams.
 */
export default class BittrexSocket extends EventEmitter {
  /**
 * BittrexSocket constructor
 * @param {string} url Url´s api.
 * @param {Array}  hub String arrays of hubs.
 * @param {string} apikey Api key.
 * @param {string} apisecret Api secret.
 * @param {Object} deps signalR zlib and uuid dep inject.
 * @param {Number} wdPeriod Watch dog period.
 */
  constructor(url, hub, apikey, apisecret, {signalR, zlib, uuid},
      wdPeriod = DEFAULT_WATCHDOG_PERIOD) {
    super();

    this.#url = url;
    this.#hub = hub;
    this.#apikey = apikey;
    this.#apisecret = apisecret;

    this.#signalR = signalR;
    this.#zlib = zlib;
    this.#uuid = uuid;

    this.#wdPeriod = wdPeriod;
    this.#checkHBStartOnce = false;
  }

  /**
 * Connects websocket to bittrex.
 */
  async connect() {
    this.#client = await this.#_connect();
    this.#heartBeat = true;

    if (this.#apisecret) {
      await this.#authenticate(this.#client);
    } else {
      logger.error('bsl: API key was not provided');
      throw new Error('No keys');
    }
  }

  /**
 * Suscribe for a especific stream.
 * @param {Array} channels channels to suscribe.
 */
  async subscribe(channels) {
    logger.debug(`bsl: subscribe to ${channels}`);

    if ( ! this.#checkHBStartOnce ) {
      channels.push('heartbeat');
      setInterval(this.#checkHB.bind(this), this.#wdPeriod);

      this.#checkHBStartOnce = true;
      logger.info('bsl: checkHB started once');
    }

    this.#channels = channels;

    const response = await this.#invoke(this.#client, 'subscribe', channels);

    for (let i = 0; i < channels.length; i++) {
      if (response[i]['Success']) {
        logger.info('bsl: Subscription to "' + channels[i] + '" successful');
      } else {
        logger.error('bsl: Subscription to "' + channels[i] + '" failed: ' +
                    response[i]['ErrorCode']);
      }
    }
  }

  /**
 * Private: Connects websocket to bittrex.
 * @return {Object} Client instance.
 */
  #_connect() {
    return new Promise((resolve) => {
      const client = this.#signalR.client(this.#url, this.#hub);

      this.#signalR.on(client, 'orderBook', this.#hub[0],
          this.#orderBookProcessor.bind(this));

      this.#signalR.on(client, 'heartbeat', this.#hub[0],
          this.#heartbeatProcessor.bind(this));

      this.#signalR.on(client, 'authenticationExpiring', this.#hub[0],
          this.#authExpProcessor.bind(this));

      this.#signalR.on(client, 'connected', this.#hub[0], () => {
        logger.info('bsl: Connected');
        return resolve(client);
      });

      this.#signalR.init(client);
    });
  }

  /**
 * Authenticates the client.
 * @param {Object} client Client instance.
 */
  async #authenticate(client) {
    logger.debug('bsl: authenticate');

    const timestamp = new Date().getTime();
    const randomContent = this.#uuid.v4();
    const content = `${timestamp}${randomContent}`;
    const signedContent = crypto.createHmac('sha512', this.#apisecret)
        .update(content).digest('hex').toUpperCase();

    const response = await this.#invoke(client, 'authenticate',
        this.#apikey,
        timestamp,
        randomContent,
        signedContent);

    if (response['Success']) {
      logger.info('bsl: Authenticated');
    } else {
      logger.error('bsl: Authentication failed: ' + response['ErrorCode']);
      throw new Error('Authentication failed');
    }
  }

  /**
 * Call a method for a client with the specified args.
 * @param {client} client Client instance.
 * @param {string} method The method to be called.
 * @return {Promise} Will resolve when response is recieved or in err case.
 */
  async #invoke(client, method, ...args) {
    return new Promise( async (resolve, reject) => {
      try {
        const result = await this.#signalR.call(client,
            this.#hub[0],
            method,
            ...args);

        resolve(result);
      } catch (err) {
        logger.error('bsl: invoke error');
        reject(err);
      }
    });
  }

  /**
   * OrderBook message handler.
   * @param {Object} m Incoming message.
   */
  #orderBookProcessor(m) {
    logger.silly('bsl: orderBookProcessor');

    const b64 = m;
    const raw = Buffer.from(b64, 'base64');

    this.#zlib.inflateRaw(raw, (err, inflated) => {
      if (err) {
        logger.error('bsl: orderBookProcessor: inflateRaw err');
        return;
      }

      const json = JSON.parse(inflated.toString('utf8'));
      this.emit('message', json);
    });
  }

  /**
   * Heartbeat message handler.
   * @param {Object} m Incoming message.
   */
  #heartbeatProcessor(m) {
    logger.debug('bsl: heartbeatProcessor');

    this.#heartBeat = true;
  }

  /**
   * Authentication expired message handler.
   * @param {Object} m Incoming message.
   */
  #authExpProcessor(m) {
    logger.info('bsl: Authentication expired');

    this.#authenticate(this.#client);
  }
  /**
   * Checks the heartBeat if missing reset connection.
   */
  #checkHB() {
    if (this.#heartBeat) {
      this.#heartBeat = false;

      logger.info('bsl: HB checked');
      return;
    }

    logger.warn('bsl: Reconecting!');

    this.#client.end();
    this.connect()
        .then( () => {
          this.subscribe(this.#channels);
        });
  }

  #channels;
  #heartBeat;
  #wdPeriod;
  #checkHBStartOnce;

  #url;
  #hub;
  #apikey;
  #apisecret;

  #signalR;
  #zlib;
  #uuid;

  #client;
  #resolveInvocationPromise = () => { };
}
