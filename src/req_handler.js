import BittrexSocket from './infra/fw_n_drivers/bittrex_socket_listener.js';
import signalRAdapter from './infra/fw_n_drivers/signalR_adapter.js';
import CONFIG from '../etc/ms_config.json' assert {type: "json"};
import {Worker} from 'worker_threads';
import {fileURLToPath} from 'url';
import path from 'path';
import zlib from 'zlib';
import {v4} from 'uuid';
import logger from './logger.js';

/**
 * Class that handels request for market status
 * use cases.
 */
export default class RequestHandler {
  /**
 * RequestHandler constructor, creates BittrexSocket
 * and lunch market status workers.
 * @param {Object} logger Logger dep inject.
 **/
  constructor(logger) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // ms workers init
    this.#workerCnt = process.env.WORKER_CNT || CONFIG.workerCnt;
    this.#workers = [];

    for (let i = 0; i < this.#workerCnt; i++) {
      this.#workers.push( new Worker(__dirname + '/ms_worker.js', {
        workerData: {cpDepthPairs: CONFIG.cpDepthPairs, workerID: i},
      }));
    }

    // bsl init

    const bslDeps = {
      signalR: signalRAdapter,
      zlib: zlib,
      uuid: {v4},
      logger: logger};

      const bittrexSocket = new BittrexSocket(
        CONFIG.bittrex.baseUrl,
        CONFIG.bittrex.hub,
        CONFIG.bittrex.apiKey,
        CONFIG.bittrex.apisecret,
        bslDeps,
    );

    // subscribe to each currency pair depth pairs
    const suscriptions = CONFIG.cpDepthPairs.map( (cpdp) => {
      return `orderbook_${cpdp.cp}_${cpdp.depth}`;
    });

    bittrexSocket.connect()
        .then( () => {
          bittrexSocket.subscribe(suscriptions);
        });

    // retransmit order book update message to workers.
    bittrexSocket.on('message', (m) => {
      this.#workers.forEach( (worker) => {
        worker.postMessage({method: 'obUpdateMessage', updateMessage: m});
      });
    });

    // Resolve promises of requested use cases
    this.#reqIndex = 0;
    this.#reqPrmoiseMap = {};

    this.#workers.forEach( (worker) => {
      worker.on('message', (data) => {
        const resolve = this.#reqPrmoiseMap[data.reqID];
        delete this.#reqPrmoiseMap[data.reqID];
        resolve(data.ret);
      });
    });

    this.#runningReq = new Map();
  }

  /**
 * Process tips request.
 * @param {string} currencyPair Cp  to be requested.
 * @return {Promise} Will resolve when worker send buck results.
 **/
  processTipsReq(currencyPair) {
    const request = 'tips' + currencyPair;
    if(this.#runningReq.has(request)){
      logger.debug('Batching');
      return this.#runningReq.get(request);
    }

    const resPromise = new Promise( (resolve) => {
      this.#workers[Math.abs(this.#reqIndex%this.#workerCnt)]
          .postMessage({
            reqID: this.#reqIndex,
            method: 'getTips',
            cp: currencyPair,
          });

      this.#reqPrmoiseMap[this.#reqIndex++] = resolve;
    });

    this.#runningReq.set(request, resPromise);

    resPromise.finally( () => {
      this.#runningReq.delete(request);
    })

    return resPromise;
  }

  /**
 * Process price calculation request.
 * @param {string} currencyPair Cp for the calculation.
 * @param {string} operation Sell or buy.
 * @param {string} amount Quantity to buy or sell.
 * @param {string} cap Limit to the efective price of operation.
 * @return {Promise} Will resolve when worker send buck results.
 **/
  processCalPriReq(currencyPair, operation, amount, cap) {
    const request = operation + currencyPair + amount + cap;
    if(this.#runningReq.has(request)){
      logger.debug('Batching');
      return this.#runningReq.get(request);
    }

    const resPromise =  new Promise( (resolve) => {
      this.#workers[Math.abs(this.#reqIndex%this.#workerCnt)]
          .postMessage({
            reqID: this.#reqIndex,
            method: 'calcPrice',
            cp: currencyPair,
            operation,
            amount,
            cap,
          });

      this.#reqPrmoiseMap[this.#reqIndex++] = resolve;
    });

    this.#runningReq.set(request, resPromise);

    resPromise.finally( () => {
      this.#runningReq.delete(request);
    })

    return resPromise;
  }

  #reqIndex;
  #reqPrmoiseMap;
  #runningReq;

  #workerCnt;
  #workers;
}
