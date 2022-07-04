/**
 * Checks the price for an especifc amount with a cap for the efective price.
 * @param {OrderBook} ob Order book.
 * @param {flaot}     amount Quantity to be purchased.
 * @param {flaot}     cap Optional celling for the purchase.
 * @return {Object} Status, amount and efectivePrice.
 */
export function buyPrice(ob, amount, cap = Infinity) {
  return calcPrice(ob, amount, cap, true);
}

/**
 * Checks the price for an especifc amount with a cap for the efective price.
 * @param {OrderBook} ob Order book.
 * @param {flaot}     amount Quantity to be selled.
 * @param {flaot}     cap Optional celling for the sale.
 * @return {Object} Status, amount and efectivePrice.
 */
export function sellPrice(ob, amount, cap = 0) {
  return calcPrice(ob, amount, cap, false);
}

/**
 * Calc the price for an especifc amount with a cap for the efective price.
 * @param {OrderBook} ob Order book.
 * @param {flaot}     amount Quantity to be selled/buyed.
 * @param {flaot}     cap Optional celling for the sale/buy.
 * @param {boolean}   isBuy Is buy or sell flag.
 * @return {Object} status amount and efectivePrice.
 */
function calcPrice(ob, amount, cap, isBuy) {
  const bids = ob.bids;
  const asks = ob.asks;

  if (bids.length === 0 || asks.length === 0 ) {
    return {status: 'Empty', message: 'Empty Order book, try in a while'};
  }

  const ret = {status: 'Failed', amount: '', efectivePrice: ''};

  let curAmount = 0;
  let curPrice = 0;
  let last = false;

  const orders = isBuy ? asks : bids;

  for (const oreder of orders) {
    const quantity = Number.parseFloat(oreder.quantity);
    const rate = Number.parseFloat(oreder.rate);
    let toSellBuy = 0;

    if ( curAmount + quantity > amount ) {
      toSellBuy = amount - curAmount;
      last = true;
    } else {
      toSellBuy = quantity;
    }

    const newCurPrice = ( curAmount * curPrice + toSellBuy * rate ) /
                        ( curAmount + toSellBuy );

    if ( isBuy && newCurPrice > cap || ! isBuy && newCurPrice < cap) {
      toSellBuy = curAmount * ( curPrice - cap ) / ( cap - rate );

      ret.efectivePrice = cap;
      ret.amount = curAmount + toSellBuy;
      ret.status = 'Cap Reached';
      break;
    }

    curAmount += toSellBuy;
    curPrice = newCurPrice;

    if (last) {
      ret.efectivePrice = curPrice;
      ret.amount = curAmount;
      ret.status = 'Success';
      break;
    }
  }

  return ret;
}
