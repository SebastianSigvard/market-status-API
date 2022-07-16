import MarketStatus from './infra/intf_adapter/market_status.js';
import {parentPort, workerData} from 'worker_threads';
import EventEmitter from 'events';
import logger from './logger.js';

const {cpDepthPairs, workerID} = workerData;
const obmEmiter = new EventEmitter;

const marketStatus = new MarketStatus(cpDepthPairs, obmEmiter, logger);

parentPort.on('message', (m) => {
  const {method, reqID} = m;

  let ret;

  switch (method) {
    case 'getTips':
      logger.debug(`obw[${workerID}]: getTips method called`);
      ret = marketStatus.processTipsReq(m.cp);
      break;
    case 'buyPrice':
      logger.debug(`obw[${workerID}]: buyPricebuyPrice method called`);
      ret = marketStatus.processCalPriReq(m.cp, m.operation, m.amount, m.cap);
      break;
    case 'sellPrice':
      logger.debug(`obw[${workerID}]: sellPrice method called`);
      ret = marketStatus.processCalPriReq(m.cp, m.operation, m.amount, m.cap);
      break;
    case 'obUpdateMessage':
      logger.silly(`obw[${workerID}]: obUpdateMessage method called`);
      obmEmiter.emit('message', m.updateMessage);
      return;
    default:
      ret = `obw[${workerID}]: invalid method call`;
      logger.debug(ret);
  }

  parentPort.postMessage({reqID, ret});
});
