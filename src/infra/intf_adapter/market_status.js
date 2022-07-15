import {buyPrice, sellPrice} from '../../core/use_cases/sell_buy_price_ob.js';
import OrderBook from '../../core/entity/order_book.js';
import getTips from '../../core/use_cases/tips_ob.js';
import ObmProcessor from './obm_processor.js';

/**
 * Class for the managment of the server app.
 **/
export default class MarketStatus {
  /**
 * MarketStatus constructor, creates orderdr books
 * and de order book message proccessor.
 * @param {Array}        cpDepthPairs All order currency pairs with Depths.
 * @param {EventEmitter} obmEmiter Order book emitter of update messages.
 * @param {Object}       logger Logger dep inject.
 **/
  constructor(cpDepthPairs, obmEmiter, logger) {
    this.#obs = {};
    this.#cps = [];
    cpDepthPairs.forEach( (cpdp) => {
      this.#obs[cpdp.cp] = new OrderBook(cpdp.depth, cpdp.cp);
      this.#cps.push(cpdp.cp);
    });

    this.#obmP = new ObmProcessor(Object.values(this.#obs), obmEmiter, logger);
  }

  /**
 * Process tips request.
 * @param {string} currencyPair Cp  to be requested.
 * @return {Object} Object with status and message or data.
 **/
  processTipsReq(currencyPair) {
    if ( ! this.#cps.includes(currencyPair) ) {
      return {
        status: 'error',
        message: 'For the moment we are not working with ' +
            `[${currencyPair}] currency pair`,
      };
    }

    return {
      status: 'success',
      currencyPair: currencyPair,
      data: getTips(this.#obs[currencyPair]),
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
    if ( ! this.#cps.includes(currencyPair) ) {
      return {
        status: 'error',
        message: 'For the moment we are not working with ' +
              `[${currencyPair}] currency pair`,
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
      res = buyPrice(
          this.#obs[currencyPair],
          Number.parseFloat(amount),
          cap ?? Infinity,
      );
    } else {
      res = sellPrice(
          this.#obs[currencyPair],
          Number.parseFloat(amount),
          cap ?? 0,
      );
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
      status: 'success',
      capReached: res.status === 'Success' ? false : true,
      data: {efectivePrice: res.efectivePrice, amount: res.amount},
    };
  }

  #bittrexSocket;
  #obs;
  #cps;
  #obmP;
}
