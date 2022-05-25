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
 * MarketStatus constructor, creates orderdr books the bittrex socket
 * and de order book message proccessor.
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
 * @return {Object} Object with status and message or data.
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
      currencyPair: currencyPair,
      data: this.#obs[currencyPair].getTips(),
    };
  }

  /**
 * Process price calculation request.
 * @param {string} currencyPair Cp for the calculation.
 * @param {string} operation Sell or buy.
 * @param {string} amount Quantity to buy or sell.
 * @param {string} cap Limit to the efective price of operation.
 * @return {Object} Object with status and message or data.
 **/
  processCalPriReq(currencyPair, operation, amount, cap) {
    if (currencyPair != 'BTC-USD' && currencyPair != 'ETH-USD' ) {
      return {
        status: 'error',
        message: 'For the moment we are only working with BTC-USD and ETH-USD',
      };
    }

    if (operation != 'buy' && operation != 'sell' ) {
      return {
        status: 'error',
        message: 'The only 2 permited operations are buy or sell',
      };
    }

    if ( Number.parseFloat(amount) <= 0) {
      return {
        status: 'error',
        message: 'The amount must be greater than 0',
      };
    }

    let res;

    if (operation === 'buy') {
      // eslint-disable-next-line max-len
      res = this.#obs[currencyPair].buyPrice(Number.parseFloat(amount), cap ?? Infinity);
    } else {
      // eslint-disable-next-line max-len
      res = this.#obs[currencyPair].sellPrice(Number.parseFloat(amount), cap ?? 0);
    }

    if (res.status === 'Failed') {
      return {
        status: 'error',
        message: `The amount to ${operation} is greater than the available`,
      };
    }

    if (res.status === 'Empty') {
      return {
        status: 'error',
        message: res.message,
      };
    }

    return {
      status: 'succes',
      capReached: res.status === 'Succes' ? false : true,
      data: {efectivePrice: res.efectivePrice, amount: res.amount},
    };
  }

  #bittrexSocket;
  #obs;
  #obmP;
}

module.exports = MarketStatus;
