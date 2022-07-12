import BittrexSocket from './infra/fw_n_drivers/bittrex_socket_listener.js';
import signalRAdapter from './infra/fw_n_drivers/signalR_adapter.js';
import ObmProcessor from './infra/intf_adapter/obm_processor.js';
import OrderBook from './core/entity/order_book.js';
import getTips from './core/use_cases/tips_ob.js';
import logger from './logger.js';
import zlib from 'zlib';
import {v4} from 'uuid';

const url = 'https://socket-v3.bittrex.com/signalr';
const hub = ['c3'];
const apikey = '7379583862cc43d9b5a2b2ee550452d1';
const apisecret = 'cc3bdafb64704d20a2413a78fea01be8';

const OB_DEPTH = 25;

const ob = new OrderBook(OB_DEPTH, 'BTC-USD');

const bslDeps = {
  signalR: signalRAdapter,
  zlib: zlib,
  uuid: {v4}};

const bittrexSocket = new BittrexSocket(url,
    hub,
    apikey,
    apisecret,
    bslDeps);

logger.info('bittrex listener created');

const obmp = new ObmProcessor([ob], bittrexSocket);

bittrexSocket.connect()
    .then( () => {
      bittrexSocket.subscribe(['orderbook_BTC-USD_25']);
    });

// eslint-disable-next-line require-jsdoc
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const loop = async () => {
  while (true) {
    logger.info(JSON.stringify(getTips(ob)));
    await sleep(1000);
  }
};

logger.info('STARTED');
loop();
