import superagent from 'superagent';
import logger from '../../logger';

// States for Synchronizing
const NOT_FETCH = 0;
const FETCHING = 1;
const FETCHED =2;

/**
 * Class for processing order books messages
 **/
export default class ObmProcessor {
  /**
 * ObmProcessor constructor
 * @param {Array} orederBooks All order books to fill and mantain.
 * @param {EventEmitter} eventEmitter Emitter of update messages.
 **/
  constructor(orederBooks, eventEmitter) {
    this.#obs = {};

    orederBooks.forEach( (orderBook) => {
      this.#obs[orderBook.currencyPair] = {
        orderBook,
        mq: [],
        sequenceNumber: -1,
        fetchState: NOT_FETCH,
      };
    });

    eventEmitter.on('message', this.#messageProcesor.bind(this));
  }

  /**
 * Process messages from Bittrex oredr book stream.
 * @param {Object} message Message to be processed.
 */
  async #messageProcesor(message) {
    const cp = message.marketSymbol;
    // Here starts the Synchronizing algorithm from Bittrex documentation.
    this.#obs[cp].mq.push(message);

    if ( this.#obs[cp].fetchState === FETCHING ) return;

    try {
      if ( this.#obs[cp].fetchState === FETCHED ) {
        this.#updateMq(this.#obs[cp]);
        return;
      }

      this.#obs[cp].fetchState = FETCHING;
      const res = await superagent.get(`https://api.bittrex.com/v3/markets/${cp}/orderbook?depth=${this.#obs[cp].orderBook.depth}`);
      const data = await this.#handleFetchResponse(res, cp);
      if ( !data ) return;

      this.#obs[cp].fetchState = FETCHED;

      this.#obs[cp].orderBook.init(data.bid, data.ask);
      this.#pruneMq(this.#obs[cp].mq, this.#obs[cp].sequenceNumber);
      this.#updateMq(this.#obs[cp]);
    } catch (err) {
      this.#handleError(err, this.#obs[cp]);
    }
  }

  /**
 * Handles fetch response to order book bittrex endpoint.
 * @param {Object} response Response of fetch.
 * @param {string} cp Currency Pair.
 * @return {Object} Body of response parsed.
 **/
  #handleFetchResponse(response, cp) {
    if (response.headers.sequence < this.#obs[cp].mq[0].sequence) {
      this.#obs[cp].fetchState = NOT_FETCH;

      logger.info(`Discarting OB snapshoot, sequence too old`);
      return;
    }

    this.#obs[cp].sequenceNumber = response.headers.sequence;
    return response.body;
  }

  /**
 * Remove messages with sequence number less than sn.
 * @param {Array} q queue of message.
 * @param {int} sn Limit sequence number.
 **/
  #pruneMq(q, sn) {
    const p = q.reduce((p, c) => {
      if ( c.sequence > sn ) {
        p.push(c);
      }

      return p;
    }, []);

    q.length = 0;
    q.push(...p);
  }

  /**
 * Updates de order book by all the messages remaining in the mq.
 * @param {Object} ob order book with mq.
 **/
  #updateMq(ob) {
    ob.mq.forEach( (message) => {
      if ( ob.sequenceNumber != -1 &&
        (message.sequence != Number.parseInt(ob.sequenceNumber) + 1) ) {
        throw new Error('Non sequent message update');
      }

      ob.orderBook.update(message.bidDeltas, message.askDeltas);
      ob.sequenceNumber = message.sequence;
    });

    ob.mq.length = 0;
  }

  /**
 * Handles errors reseting the order book and state.
 * @param {Object} error Error.
 * @param {Object} ob Orderbook and context.
 **/
  #handleError(error, ob) {
    ob.fetchState = NOT_FETCH;
    ob.mq.length = 0;
    ob.sequenceNumber = -1;

    logger.error(error);
  }

  #obs;
}
