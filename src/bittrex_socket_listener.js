const signalR = require('signalr-client');
const logger = require('./logger');
const crypto = require('crypto');
const zlib = require('zlib');
const uuid = require('uuid');

const WATCHDOG_PERIOD = 600000;
/**
 * Class that handels websocket connection to bittrex api, allowing
 * you to suscribe to multiples streams.
 */
class BittrexSocket {
  /**
 * BittrexSocket constructor
 * @param {string} url Url´s api.
 * @param {Array}  hub String arrays of hubs.
 * @param {string} apikey Api key.
 * @param {string} apisecret Api secret key.
 */
  constructor(url, hub, apikey, apisecret) {
    this.#url = url;
    this.#hub = hub;
    this.#apikey = apikey;
    this.#apisecret = apisecret;
    this.#checkHBStartOnce = false;
  }

  /**
 * Connects websocket to bittrex.
 * @param {function} messageProcessor Message user procesor.
 */
  async connect(messageProcessor) {
    this.#messageProcessor = messageProcessor;
    this.#client = await this.#_connect();
    this.#heartBeat = true;

    if (this.#apisecret) {
      await this.#authenticate(this.#client);
    } else {
      logger.error('Authentication skipped because API key was not provided');
      throw new Error('No keys');
    }
  }

  /**
 * Suscribe for a especific stream.
 * @param {Array} channels channels to suscribe.
 */
  async subscribe(channels) {
    if ( ! this.#checkHBStartOnce ) {
      channels.push('heartbeat');
      setInterval(this.#checkHB.bind(this), WATCHDOG_PERIOD);

      this.#checkHBStartOnce = true;
      logger.info('checkHB started once');
    }

    this.#channels = channels;

    const response = await this.#invoke(this.#client, 'subscribe', channels);

    for (let i = 0; i < channels.length; i++) {
      if (response[i]['Success']) {
        logger.info('Subscription to "' + channels[i] + '" successful');
      } else {
        logger.error('Subscription to "' + channels[i] + '" failed: ' +
                    response[i]['ErrorCode']);
      }
    }
  }

  /**
 * Private: Connects websocket to bittrex.
 * @return {Object} Client instance.
 */
  async #_connect() {
    return new Promise((resolve) => {
      // eslint-disable-next-line new-cap
      const client = new signalR.client(this.#url, this.#hub);

      client.serviceHandlers.messageReceived = this.#messageReceived.bind(this);

      client.serviceHandlers.connected = () => {
        logger.info('Connected');
        return resolve(client);
      };
    });
  }

  /**
 * Authenticates the client.
 * @param {Object} client Client instance.
 */
  async #authenticate(client) {
    const timestamp = new Date().getTime();
    const randomContent = uuid.v4();
    const content = `${timestamp}${randomContent}`;
    const signedContent = crypto.createHmac('sha512', this.#apisecret)
        .update(content).digest('hex').toUpperCase();

    const response = await this.#invoke(client, 'authenticate',
        this.#apikey,
        timestamp,
        randomContent,
        signedContent);

    if (response['Success']) {
      logger.info('Authenticated');
    } else {
      logger.error('Authentication failed: ' + response['ErrorCode']);
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
    return new Promise((resolve, reject) => {
      this.#resolveInvocationPromise = resolve;
      // Promise will be resolved when response message received

      client.call(this.#hub[0], method, ...args)
          .done(function(err) {
            if (err) {
              return reject(err);
            }
          });
    });
  }

  /**
   * The message handler.
   * @param {int} message Incoming message.
   */
  #messageReceived(message) {
    const data = JSON.parse(message.utf8Data);

    if (data['R']) {
      this.#resolveInvocationPromise(data.R);
      return;
    }

    if (data['M']) {
      data.M.forEach( (m) => {
        if (m['A']) {
          if (m.A[0]) {
            const b64 = m.A[0];
            // eslint-disable-next-line new-cap
            const raw = new Buffer.from(b64, 'base64');

            zlib.inflateRaw(raw, (err, inflated) => {
              if (!err) {
                const json = JSON.parse(inflated.toString('utf8'));
                this.#messageProcessor(json);
              }
            });
          } else if (m.M == 'heartbeat') {
            this.#heartBeat = true;
          } else if (m.M == 'authenticationExpiring') {
            logger.info('Authentication expiring...');

            this.#authenticate(this.#client);
          }
        }
      });
    }
  }

  /**
   * Checks the heartBeat if missing reset connection.
   */
  #checkHB() {
    if (this.#heartBeat) {
      this.#heartBeat = false;

      logger.info('HB checked');
      return;
    }

    logger.warn('Reconecting!');

    this.#client.end();
    this.connect(this.#messageProcessor)
        .then( () => {
          this.subscribe(this.#channels);
        });
  }

  #channels;
  #heartBeat;
  #checkHBStartOnce;

  #url;
  #hub;
  #apikey;
  #apisecret;

  #client;
  #resolveInvocationPromise = () => { };
  #messageProcessor = () => { };
}

module.exports = BittrexSocket;
