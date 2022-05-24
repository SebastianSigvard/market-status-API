const BittrexSocket = require('./bittrex_socket_listener');
const ObmProcessor = require('./obm_processor');
const OrderBook = require('./order_book');

// this config may be taken from a config file (yaml/json).
const url = 'wss://socket-v3.bittrex.com/signalr';
const hub = ['c3'];
// the keys for security must be in a separate file.
const apikey = '7379583862cc43d9b5a2b2ee550452d1';
const apisecret = 'cc3bdafb64704d20a2413a78fea01be8';

const OB_DEPTH = 25;

/**
 * Class for the managment of the server app.
 **/
class MarketStatus {
  /**
 * Constructor
 **/
  constructor() {
    this.#bittrexSocket = new BittrexSocket(url, hub, apikey, apisecret);
    this.#obs = {};
    const obBtcUsd = new OrderBook(OB_DEPTH, 'BTC-USD');
    const obEthUsd = new OrderBook(OB_DEPTH, 'ETH-USD');
    this.#obs['BTC-USD'] = obBtcUsd;
    this.#obs['ETH-USD'] = obEthUsd;

    this.#obmP = new ObmProcessor([obBtcUsd, obEthUsd]);

    const channels = [
      'orderbook_BTC-USD_' + OB_DEPTH,
      'orderbook_ETH-USD_' + OB_DEPTH,
    ];

    this.#bittrexSocket.connect(this.#obmP.messageProcesor)
        .then( () => {
          this.#bittrexSocket.subscribe(channels);
        });
  }

  /**
 * Process tips request.
 * @param {string} currencyPair Cp  to be requested.
 * @return {Object} object with status and message or data.
 **/
  processTipsReq(currencyPair) {
    if (currencyPair != 'BTC-USD' && currencyPair != 'ETH-USD' ) {
      return {
        status: 'error',
        message: 'For the moment we are only working with BTC-USD and ETH-USD',
      };
    }
    return {
      status: 'success',
      currency: currencyPair,
      data: this.#obs[currencyPair].getTips(),
    };
  }

  #bittrexSocket;
  #obs;
  #obmP;
}

module.exports = MarketStatus;
