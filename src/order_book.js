/**
 * Error class for Order Book class.
 */
class ErrorOB extends Error {
  /**
 * ErrorOB constructor.
 * @param {string} args Message of error.
 * @param {int} code Error code.
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
    this.#insertDeltas(bidDeltas, this.#bids);
    this.#insertDeltas(askDeltas, this.#asks);

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
 * Updates order array with delta (bids/asks).
 * @param {Array} deltas Array of deltas to be updated in orders array.
 * @param {Array} orders Order array to be updateded.
 */
  #insertDeltas(deltas, orders) {
    deltas.forEach( (delta) => {
      if ( ! delta.hasOwnProperty('quantity') ||
           ! delta.hasOwnProperty('rate') ) {
        throw new ErrorOB('Order must have rate and quantity keys', BAD_KEYS);
      }

      const i = orders.findIndex( (_o) => _o.rate === delta.rate );

      if ( i === -1 ) {
        orders.push( {
          quantity: delta.quantity,
          rate: delta.rate,
        });
        return;
      }

      if ( delta.quantity === '0' ) {
        orders.splice(i, 1);
        return;
      }

      orders[i].quantity = delta.quantity;
    });
  }

  /**
 * Currency pair getter.
 * @return {Object} Best rate for bid and ask and the quantity.
 */
  getTips() {
    if (this.#bids.length === 0 || this.#asks.length === 0 ) {
      return {status: 'Empty', message: 'Order book empty, try in a while'};
    }

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
    if (this.#bids.length === 0 || this.#asks.length === 0 ) {
      return {status: 'Empty', message: 'Order book empty, try in a while'};
    }

    const ret = {status: 'Failed', amount: '', efectivePrice: ''};

    let curAmount = 0;
    let curPrice = 0;
    let last = false;

    const orders = isBuy ? this.#asks : this.#bids;

    for (const oreder of orders) {
      const quantity = Number.parseFloat(oreder.quantity);
      const rate = Number.parseFloat(oreder.rate);
      let toSellBuy = 0;

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
