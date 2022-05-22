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
 * @param {int} depth depth of the order book.
 */
  constructor(depth = 25) {
    this.#depth = Number.parseInt(depth);
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

      if ( Number.parseInt(bid.quantity) === 0 ) {
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

      if ( Number.parseInt(ask.quantity) === 0 ) {
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
  }

  #depth;
  #bids;
  #asks;
}

module.exports = OrderBook;
