import BittrexSocket from './infra/fw_n_drivers/bittrex_socket_listener.js';
import signalRAdapter from './infra/fw_n_drivers/signalR_adapter.js';
import MarketStatus from './infra/intf_adapter/market_status.js';
import logger from './logger.js';
import zlib from 'zlib';
import {v4} from 'uuid';

const url = 'https://socket-v3.bittrex.com/signalr';
const hub = ['c3'];
const apikey = '7379583862cc43d9b5a2b2ee550452d1';
const apisecret = 'cc3bdafb64704d20a2413a78fea01be8';

const OB_DEPTH = 25;

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

const marketStatus = new MarketStatus(
    [
      {cp: 'BTC-USD', depth: OB_DEPTH},
      {cp: 'ETH-USD', depth: OB_DEPTH},
    ],
    bittrexSocket,
    logger,
);

bittrexSocket.connect()
    .then( () => {
      bittrexSocket.subscribe(['orderbook_BTC-USD_25', 'orderbook_ETH-USD_25']);
    });

// eslint-disable-next-line require-jsdoc
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const loop = async () => {
  await sleep(4000);
  while (true) {
    logger.info(JSON.stringify(marketStatus.processTipsReq('BTC-USD')));
    logger.info(JSON.stringify(marketStatus.processTipsReq('ETH-USD')));
    await sleep(1000);
  }
};

logger.info('STARTED');
loop();
