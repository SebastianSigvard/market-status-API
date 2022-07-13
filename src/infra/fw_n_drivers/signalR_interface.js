/**
 * Abstract class for signalR interface definition for
 * bittrex socket listener.
 */
export class SignalRInterface {
  /**
   * Creates a new client
   * @param {string} url Url´s api.
   * @param {Array}  hubs String arrays of hubs.
   * @return {Object} Client object.
  */
  client(url, hubs) {
    throw new Error('No implementation of signalRInterface virtual fun.');
    return {};
  }

  /**
   * Installs a message processor over a client
   * @param {Object}   client SignalR client.
   * @param {Object}   event Event to install mp.
   * @param {String}   hub Hub name.
   * @param {Function} mp Message Processor function.
  */
  on(client, event, hub, mp) {
    throw new Error('No implementation of signalRInterface virtual fun.');
  }

  /**
   * Inits connection.
   * @param {Object}   client SignalR client.
  */
  init(client) {
    throw new Error('No implementation of signalRInterface virtual fun.');
  }

  /**
   * Calls a mehtod with args for a given client and hub.
   * @param {Object}   client SignalR client.
   * @param {String}   hub Hub name.
   * @param {String}   method Method name to be called.
   * @return {Promise} Promise that can be rejected or resolved.
  */
  call(client, hub, method, ...args) {
    throw new Error('No implementation of signalRInterface virtual fun.');
    return {};
  }
}

export default new SignalRInterface();

