/**
 * Error class for Order Book class.
 */
class ErrorOB extends Error {
  /**
 * constructor.
 * @param {string} args array with all the bids.
 * @param {int} code array with all the asks.
 */
  constructor(args, code = DEFAULT) {
    super(args);
    this.code = code;
  }
}

const DEFAULT = -1;
const BAD_DEPTH = 0;
const BAD_KEYS = 1;
const INCONSISTENT_UPDATE = 2;

/**
 * Class to create and mantain order books.
 */
class OrderBook {
  /**
 * Constructor
 * @param {int} depth Depth of the order book.
 * @param {string} currencyPair Currency pair.
 */
  constructor(depth = 25, currencyPair = 'BTC-USD') {
    this.#depth = Number.parseInt(depth);
    this.#currencyPair = currencyPair;
    this.#bids = [];
    this.#asks = [];
  }

  /**
 * Inits the order book.
 * @param {Array} bids array with all the bids.
 * @param {Array} asks array with all the asks.
 */
  init(bids, asks) {
    if ( bids.length != this.#depth || asks.length != this.#depth ) {
      // eslint-disable-next-line
      throw new ErrorOB(`Bids and/or Asks length not equal to depth of order book`, BAD_DEPTH);
    }

    this.#bids = [];
    this.#asks = [];

    bids.forEach( (bid) => {
      if ( ! bid.hasOwnProperty('quantity') || ! bid.hasOwnProperty('rate') ) {
        throw new ErrorOB('All bids must have rate and quantity keys',
            BAD_KEYS);
      }
      this.#bids.push( {
        quantity: bid.quantity,
        rate: bid.rate,
      });
    });

    asks.forEach( (ask) => {
      if ( ! ask.hasOwnProperty('quantity') || ! ask.hasOwnProperty('rate') ) {
        throw new ErrorOB('Ask must have rate and quantity keys', BAD_KEYS);
      }
      this.#asks.push( {
        quantity: ask.quantity,
        rate: ask.rate,
      });
    });

    this.#sort();
  }

  /**
 * Updates order book with bids and asks deltas.
 * @param {Array} bidDeltas array with all the bids deltas.
 * @param {Array} askDeltas array with all the asks deltas.
 */
  update(bidDeltas, askDeltas) {
    bidDeltas.forEach( (bid) => {
      if ( ! bid.hasOwnProperty('quantity') || ! bid.hasOwnProperty('rate') ) {
        throw new ErrorOB('Bids must have rate and quantity keys', BAD_KEYS);
      }

      const i = this.#bids.findIndex( (_b) => _b.rate === bid.rate );

      if ( i === -1 ) {
        this.#bids.push( {
          quantity: bid.quantity,
          rate: bid.rate,
        });
        return;
      }

      if ( bid.quantity === '0' ) {
        this.#bids.splice(i, 1);
        return;
      }

      this.#bids[i].quantity = bid.quantity;
    });

    askDeltas.forEach( (ask) => {
      if ( ! ask.hasOwnProperty('quantity') || ! ask.hasOwnProperty('rate') ) {
        throw new ErrorOB('Asks must have rate and quantity keys', BAD_KEYS);
      }

      const i = this.#asks.findIndex( (_a) => _a.rate === ask.rate );

      if ( i === -1 ) {
        this.#asks.push( {
          quantity: ask.quantity,
          rate: ask.rate,
        });
        return;
      }

      if ( ask.quantity === '0' ) {
        this.#asks.splice(i, 1);
        return;
      }

      this.#asks[i].quantity = ask.quantity;
    });

    if ( this.#asks.length != this.#depth ||
         this.#bids.length != this.#depth ) {
      this.#bids = [];
      this.#asks = [];
      // eslint-disable-next-line
      throw new ErrorOB(`Inconsistent update, order book reseted, please init again`, INCONSISTENT_UPDATE);
    }

    this.#sort();
  }

  /**
 * Currency pair getter.
 * @return {Object} Best rate for bid and ask and the quantity.
 */
  getTips() {
    return {bid: this.#bids[0], ask: this.#asks[0]};
  }

  /**
 * Checks the price for an especifc amount with a cap for the efective price.
 * @param {flaot} amount quantity to be purchased.
 * @param {flaot} cap optional celling for the purchase.
 * @return {Object} status amount and efectivePrice.
 */
  buyPrice(amount, cap = Infinity) {
    return this.#calcPrice(amount, cap, true);
  }

  /**
   * Checks the price for an especifc amount with a cap for the efective price.
   * @param {flaot} amount quantity to be selled.
   * @param {flaot} cap optional celling for the sale.
   * @return {Object} status amount and efectivePrice.
   */
  sellPrice(amount, cap = 0) {
    return this.#calcPrice(amount, cap, false);
  }

  /**
   * Calc the price for an especifc amount with a cap for the efective price.
   * @param {flaot} amount quantity to be selled/buyed.
   * @param {flaot} cap optional celling for the sale/buy.
   * @param {boolean} isBuy is buy or sell flag.
   * @return {Object} status amount and efectivePrice.
   */
  #calcPrice(amount, cap, isBuy) {
    const ret = {status: 'Failed', amount: '', efectivePrice: ''};
    let curAmount = 0;
    let curPrice = 0;
    let last = false;

    const orders = isBuy ? this.#asks : this.#bids;

    for (const oreder of orders) {
      let toSellBuy = 0;
      const rate = Number.parseFloat(oreder.rate);
      const quantity = Number.parseFloat(oreder.quantity);

      if ( curAmount + quantity > amount ) {
        toSellBuy = amount - curAmount;
        last = true;
      } else {
        toSellBuy = quantity;
      }
      // eslint-disable-next-line max-len
      const newCurPrice = ( curAmount * curPrice + toSellBuy * rate ) / ( curAmount + toSellBuy );

      if ( isBuy && newCurPrice > cap || ! isBuy && newCurPrice < cap) {
        toSellBuy = curAmount * ( curPrice - cap ) / ( cap - rate );
        ret.efectivePrice = cap;
        ret.amount = curAmount + toSellBuy;
        ret.status = 'Cap Reached';
        break;
      }

      curAmount += toSellBuy;
      curPrice = newCurPrice;

      if (last) {
        ret.efectivePrice = curPrice;
        ret.amount = curAmount;
        ret.status = 'Succes';
        break;
      }
    }

    return ret;
  }

  /**
 * Currency pair getter.
 */
  get currencyPair() {
    return this.#currencyPair;
  }

  /**
 * Depth getter.
 */
  get depth() {
    return this.#depth;
  }

  /**
 * Sorts asks and bids arrays.
 */
  #sort() {
    this.#asks.sort( (a, b) => {
      return a.rate - b.rate;
    });
    this.#bids.sort( (a, b) => {
      return b.rate - a.rate;
    });
  }

  #depth;
  #bids;
  #asks;
  #currencyPair;
}

module.exports = OrderBook;
