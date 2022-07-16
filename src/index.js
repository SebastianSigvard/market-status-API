import BittrexSocket from './infra/fw_n_drivers/bittrex_socket_listener.js';
import signalRAdapter from './infra/fw_n_drivers/signalR_adapter.js';
import {Worker} from 'worker_threads';
import {fileURLToPath} from 'url';
import logger from './logger.js';
import path from 'path';
import zlib from 'zlib';
import {v4} from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://socket-v3.bittrex.com/signalr';
const hub = ['c3'];
const apikey = '7379583862cc43d9b5a2b2ee550452d1';
const apisecret = 'cc3bdafb64704d20a2413a78fea01be8';

const OB_DEPTH = 25;

const cpDepthPairs = [
  {cp: 'BTC-USD', depth: OB_DEPTH},
  {cp: 'ETH-USD', depth: OB_DEPTH},
];

const worker = new Worker(__dirname + '/ob_worker.js', {
  workerData: {cpDepthPairs, workerID: 0},
});

const bslDeps = {
  signalR: signalRAdapter,
  zlib: zlib,
  uuid: {v4},
  logger: logger};

const bittrexSocket = new BittrexSocket(url,
    hub,
    apikey,
    apisecret,
    bslDeps);

logger.info('bittrex listener created');

bittrexSocket.connect()
    .then( () => {
      bittrexSocket.subscribe(['orderbook_BTC-USD_25', 'orderbook_ETH-USD_25']);
    });

bittrexSocket.on('message', (m) => {
  worker.postMessage({method: 'obUpdateMessage', updateMessage: m});
});

worker.on('message', (data) => {
  logger.info(`From worker: reqID: ${data.reqID} ret: ${JSON.stringify(data)}`);
});

// eslint-disable-next-line require-jsdoc
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let reqID = 0;
const loop = async () => {
  await sleep(4000);
  while (true) {
    worker.postMessage({reqID: reqID++, method: 'getTips', cp: 'BTC-USD'});
    await sleep(1000);
    worker.postMessage({reqID: reqID++, method: 'buyPrice',
      cp: 'BTC-USD',
      operation: 'buy',
      amount: 1});
    await sleep(1000);
    worker.postMessage({reqID: reqID++, method: 'sellPrice',
      cp: 'ETH-USD',
      operation: 'sell',
      amount: 1});
    await sleep(1000);
  }
};

logger.info('STARTED');
loop();
