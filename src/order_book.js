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
const BAD_UPDATE = 2;
const INCONSISTENT_UPDATE = 3;

/**
 * Class to create and mantain order books.
 */
class OrderBook {
  /**
 * Constructor
 * @param {int} depth depth of the order book.
 */
  constructor(depth) {
    this.#depth = depth;
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
      const e = new ErrorOB(`Bids and/or Asks length
                             not equal to depth of order book`);
      e.code = BAD_DEPTH;
      throw e;
    }

    this.#bids = [];
    this.#asks = [];

    bids.forEach( (bid) => {
      if ( ! bid.hasOwnProperty('quantity') || ! bid.hasOwnProperty('rate') ) {
        const e = new ErrorOB('All bids must have rate and quantity keys');
        e.code = BAD_KEYS;
        throw e;
      }
      this.#bids.push( {
        quantity: Number.parseInt(bid.quantity),
        rate: Number.parseInt(bid.rate),
      });
    });

    asks.forEach( (ask) => {
      if ( ! ask.hasOwnProperty('quantity') || ! ask.hasOwnProperty('rate') ) {
        const e = new ErrorOB('All ask must have rate and quantity keys');
        e.code = BAD_KEYS;
        throw e;
      }
      this.#asks.push( {
        quantity: Number.parseInt(ask.quantity),
        rate: Number.parseInt(ask.rate),
      });
    });
  }

  /**
 * Updates order book with bids and asks deltas.
 * @param {Array} bidDeltas array with all the bids deltas.
 * @param {Array} askDeltas array with all the asks deltas.
 */
  update(bidDeltas, askDeltas) {
    bidDeltas.forEach( (bid) => {
      if ( ! bid.hasOwnProperty('quantity') || ! bid.hasOwnProperty('rate') ) {
        const e = new ErrorOB('All bids must have rate and quantity keys');
        e.code = BAD_KEYS;
        throw e;
      }

      const i = this.#bids.findIndex( (_b) => _b.rate === bid.rate );

      if ( i === -1 && Number.parseInt(bid.quantity) === 0) {
        const e = new ErrorOB('Updating non existing bid');
        e.code = BAD_UPDATE;
        throw e;
      }

      if ( i === -1 ) {
        this.#bids.push( {
          quantity: Number.parseInt(bid.quantity),
          rate: Number.parseInt(bid.rate),
        });
        return;
      }

      if ( Number.parseInt(bid.quantity) === 0 ) {
        this.#bids.splice(i, 1);
        return;
      }

      this.#bids[i].quantity = bid.quantity;
    });

    askDeltas.forEach( (ask) => {
      if ( ! ask.hasOwnProperty('quantity') || ! ask.hasOwnProperty('rate') ) {
        const e = new ErrorOB('All asks must have rate and quantity keys');
        e.code = BAD_KEYS;
        throw e;
      }

      const i = this.#asks.findIndex( (_a) => _a.rate === ask.rate );

      if ( i === -1 && Number.parseInt(ask.quantity) === 0) {
        const e = new ErrorOB('Updating non existing ask');
        e.code = BAD_UPDATE;
        throw e;
      }

      if ( i === -1 ) {
        this.#asks.push( {
          quantity: Number.parseInt(ask.quantity),
          rate: Number.parseInt(ask.rate),
        });
        return;
      }

      if ( Number.parseInt(ask.quantity) === 0 ) {
        this.#asks.splice(i, 1);
        return;
      }

      this.#asks[i].quantity = ask.quantity;
    });

    if ( this.#asks.length != this.#depth || this.#bids != this.#depth ) {
      this.#bids = [];
      this.#asks = [];

      const e = new ErrorOB(`Inconsistent update, order book reseted,
                             please init again`);
      e.code = INCONSISTENT_UPDATE;
      throw e;
    }
  }

  #depth;
  #bids;
  #asks;
}

module.exports = OrderBook;
