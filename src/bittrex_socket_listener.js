const signalR = require('signalr-client');
const crypto = require('crypto');
const zlib = require('zlib');
const uuid = require('uuid');

/**
 * Class that handels websocket connection to bittrex api, allowing
 * you to suscribe to multiples streams.
 */
class BittrexSocket {
  /**
 * BittrexSocket constructor
 * @param {string} url Url´s api.
 * @param {Array} hub String arrays of hubs.
 * @param {string} apikey Api key.
 * @param {string} apisecret Api secret key.
 */
  constructor(url, hub, apikey, apisecret) {
    this.#url = url;
    this.#hub = hub;
    this.#apikey = apikey;
    this.#apisecret = apisecret;
  }

  /**
 * Connects websocket to bittrex.
 * @param {function} messageProcessor Message user procesor.
 */
  async connect(messageProcessor) {
    this.#messageProcessor = messageProcessor;
    this.#client = await this.#_connect();

    if (this.#apisecret) {
      await this.#authenticate(this.#client);
    } else {
      console.log('Authentication skipped because API key was not provided');
      throw new Error('No keys');
    }
  }

  /**
 * Suscribe for a especific stream.
 * @param {Array} channels channels to suscribe.
 */
  async subscribe(channels) {
    const response = await this.#invoke(this.#client, 'subscribe', channels);

    for (let i = 0; i < channels.length; i++) {
      if (response[i]['Success']) {
        console.log('Subscription to "' + channels[i] + '" successful');
      } else {
        console.log('Subscription to "' + channels[i] + '" failed: ' +
                    response[i]['ErrorCode']);
      }
    }
  }

  /**
 * Private: Connects websocket to bittrex.
 * @return {Object} client instance.
 */
  async #_connect() {
    return new Promise((resolve) => {
      // eslint-disable-next-line new-cap
      const client = new signalR.client(this.#url, this.#hub);
      client.serviceHandlers.messageReceived = this.#messageReceived.bind(this);
      client.serviceHandlers.connected = () => {
        console.log('Connected');
        return resolve(client);
      };
    });
  }

  /**
 * Authenticates the client.
 * @param {Object} client client instance.
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
      console.log('Authenticated');
    } else {
      console.log('Authentication failed: ' + response['ErrorCode']);
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
    } else if (data['M']) {
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
            console.log('\u2661');
          } else if (m.M == 'authenticationExpiring') {
            console.log('Authentication expiring...');
            this.#authenticate(this.#client);
          }
        }
      });
    }
  }

  #url;
  #hub;
  #apikey;
  #apisecret;

  #client;
  #resolveInvocationPromise = () => { };
  #messageProcessor = () => { };
}

module.exports = BittrexSocket;
