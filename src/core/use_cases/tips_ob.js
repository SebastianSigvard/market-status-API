/**
 * Currency pair getter.
 * @param {OrderBook} ob Order book.
 * @return {Object} Best rate for bid and ask and the quantity.
 */
export default function getTips(ob) {
  const bids = ob.bids;
  const asks = ob.asks;

  if (bids.length === 0 || asks.length === 0 ) {
    return {status: 'Empty', message: 'Empty Order book, try in a while'};
  }

  return {bid: bids[0], ask: asks[0]};
}
