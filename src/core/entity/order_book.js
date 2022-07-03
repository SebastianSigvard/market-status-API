/**
 * Error class for Order Book class.
 */
class ErrorOB extends Error {
  /**
   * ErrorOB constructor.
   * @param {string} args Message of error.
   * @param {int}    code Error code.
   */
  constructor(args, code = DEFAULT_ERROR) {
    super(args);
    this.code = code;
    Error.captureStackTrace(this);
  }
}

const DEFAULT_ERROR = -1;
const BAD_DEPTH_ERROR = 0;
const BAD_KEYS_ERROR = 1;
const INCONSISTENT_UPDATE_ERROR = 2;

/**
 * Class to create and mantain order books.
 */
export default class OrderBook {
  /**
   * Constructor
   * @param {int}    depth Depth of the order book.
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
   * @param {Array} bids Array with all the bids.
   * @param {Array} asks Array with all the asks.
   */
  init(bids, asks) {
    if ( bids.length != this.#depth || asks.length != this.#depth ) {
      throw new ErrorOB(`Bids and/or Asks length not equal` +
      ` to depth of order book`, BAD_DEPTH_ERROR);
    }

    this.#bids = [];
    this.#asks = [];

    bids.forEach( (bid) => {
      if ( ! bid.hasOwnProperty('quantity') || ! bid.hasOwnProperty('rate') ) {
        throw new ErrorOB('All bids must have rate and quantity keys',
            BAD_KEYS_ERROR);
      }

      this.#bids.push( {
        quantity: bid.quantity,
        rate: bid.rate,
      });
    });

    asks.forEach( (ask) => {
      if ( ! ask.hasOwnProperty('quantity') || ! ask.hasOwnProperty('rate') ) {
        throw new ErrorOB('Ask must have rate and quantity keys',
            BAD_KEYS_ERROR);
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
   * @param {Array} bidDeltas Array with all the bids deltas.
   * @param {Array} askDeltas Array with all the asks deltas.
   */
  update(bidDeltas, askDeltas) {
    this.#insertDeltas(bidDeltas, this.#bids);
    this.#insertDeltas(askDeltas, this.#asks);

    if ( this.#asks.length != this.#depth ||
           this.#bids.length != this.#depth ) {
      this.#bids = [];
      this.#asks = [];

      throw new ErrorOB(`Inconsistent update, order book reseted,` +
        ` please init again`, INCONSISTENT_UPDATE_ERROR);
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
        throw new ErrorOB('Order must have rate and quantity keys',
            BAD_KEYS_ERROR);
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
   * Sorts asks and bids arrays.
   */
  #sort() {
    this.#asks.sort( (a, b) => a.rate - b.rate);
    this.#bids.sort( (a, b) => b.rate - a.rate);
  }

  /**
   * Bids getter.
   */
  get bids() {
    return [...this.#bids];
  }

  /**
   * Asks getter.
   */
  get asks() {
    return [...this.#asks];
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

  #depth;
  #bids;
  #asks;
  #currencyPair;
}
