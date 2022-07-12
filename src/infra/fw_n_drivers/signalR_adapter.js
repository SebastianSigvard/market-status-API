import SignalR from 'node-signalr';
import logger from '../../logger.js';

/**
 * Adapter for node-signalr module for bittrex socket listener.
 */
class SignalRAdapter {
  /**
 * Creates a new client
 * @param {string} url Url´s api.
 * @param {Array}  hubs String arrays of hubs.
 * @return {Object} Client object.
*/
  client(url, hubs) {
    // eslint-disable-next-line new-cap
    return new SignalR.client(url, hubs);
  }

  /**
 * Installs a message processor over a client
 * @param {Object}   client SignalR client.
 * @param {Object}   event Event to install mp.
 * @param {String}   hub Hub name.
 * @param {Function} mp Message Processor function.
*/
  on(client, event, hub, mp) {
    if (event == 'connected') {
      client.on('connected', mp);
      return;
    }

    client.connection.hub.on(hub, event, mp);
  }


  /**
 * Inits connection.
 * @param {Object}   client SignalR client.
*/
  init(client) {
    client.start();
  }

  /**
 * Calls a mehtod with args for a given client and hub.
 * @param {Object}   client SignalR client.
 * @param {String}   hub Hub name.
 * @param {String}   method Method name to be called.
 * @return {Promise} Promise that can be rejected or resolved.
*/
  call(client, hub, method, ...args) {
    logger.debug(`sra: Calling ${method}`);
    return client.connection.hub.call(hub, method, ...args);
  }
}

export default new SignalRAdapter();
