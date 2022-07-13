import signalRInterface, {SignalRInterface} from './signalR_interface.js';
import EventEmitter from 'events';
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
 * @param {Object} deps signalR, zlib, uuid and logger dep inject.
 * @param {Number} wdPeriod Watch dog period.
 */
  constructor(url, hub, apikey, apisecret,
      {signalR = signalRInterface, zlib, uuid, logger},
      wdPeriod = DEFAULT_WATCHDOG_PERIOD) {
    super();

    this.#url = url;
    this.#hub = hub;
    this.#apikey = apikey;
    this.#apisecret = apisecret;

    if (! (Object.getPrototypeOf(signalR) instanceof SignalRInterface)) {
      throw Error('signalR dep inject must be an instance of SignalRInterface');
    }
    this.#signalR = signalR;
    this.#zlib = zlib;
    this.#uuid = uuid;
    this.#logger = logger;

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
      this.#logger.error('bsl: API key was not provided');
      throw new Error('No keys');
    }
  }

  /**
 * Suscribe for a especific stream.
 * @param {Array} channels channels to suscribe.
 */
  async subscribe(channels) {
    this.#logger.debug(`bsl: subscribe to ${channels}`);

    if ( ! this.#checkHBStartOnce ) {
      channels.push('heartbeat');
      setInterval(this.#checkHB.bind(this), this.#wdPeriod);

      this.#checkHBStartOnce = true;
      this.#logger.info('bsl: checkHB started once');
    }

    this.#channels = channels;

    const response = await this.#invoke(this.#client, 'subscribe', channels);

    for (let i = 0; i < channels.length; i++) {
      if (response[i]['Success']) {
        this.#logger.info('bsl: Subscription to "' + channels[i] +
          '" successful');
      } else {
        this.#logger.error('bsl: Subscription to "' + channels[i] +
          '" failed: ' + response[i]['ErrorCode']);
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
        this.#logger.info('bsl: Connected');
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
    this.#logger.debug('bsl: authenticate');

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
      this.#logger.info('bsl: Authenticated');
    } else {
      this.#logger.error('bsl: Authentication failed: ' +
                          response['ErrorCode']);

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
        this.#logger.error('bsl: invoke error');
        reject(err);
      }
    });
  }

  /**
   * OrderBook message handler.
   * @param {Object} m Incoming message.
   */
  #orderBookProcessor(m) {
    this.#logger.silly('bsl: orderBookProcessor');

    const b64 = m;
    const raw = Buffer.from(b64, 'base64');

    this.#zlib.inflateRaw(raw, (err, inflated) => {
      if (err) {
        this.#logger.error('bsl: orderBookProcessor: inflateRaw err');
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
    this.#logger.debug('bsl: heartbeatProcessor');

    this.#heartBeat = true;
  }

  /**
   * Authentication expired message handler.
   * @param {Object} m Incoming message.
   */
  #authExpProcessor(m) {
    this.#logger.info('bsl: Authentication expired');

    this.#authenticate(this.#client);
  }
  /**
   * Checks the heartBeat if missing reset connection.
   */
  #checkHB() {
    if (this.#heartBeat) {
      this.#heartBeat = false;

      this.#logger.info('bsl: HB checked');
      return;
    }

    this.#logger.warn('bsl: Reconecting!');

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
  #logger;

  #client;
}
