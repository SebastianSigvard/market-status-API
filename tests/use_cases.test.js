import OrderBook from '../src/core/entity/order_book';
import getTips from '../src/core/use_cases/tips_ob';
import {buyPrice, sellPrice} from '../src/core/use_cases/sell_buy_price_ob';
import {shuffle, initialBid, initialAsk} from './helpers';

const orderBook = new OrderBook(25);

test('Get Tips', () => {
  shuffle(initialBid);
  shuffle(initialAsk);
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
  expect(
      getTips(orderBook),
  ).toStrictEqual({bid: {'quantity': '0.19157204', 'rate': '29954.31800000'},
    ask: {'quantity': '0.19500000', 'rate': '29964.38100000'}});
});

test('Buy Price no cap reached', () => {
  shuffle(initialBid);
  shuffle(initialAsk);
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
  expect(
      buyPrice(orderBook, 1.19769275, 29969.51241).efectivePrice,
  ).toBeCloseTo(29969.31162, 5); // Google sheets calculated result
});

test('Buy Price cap reached', () => {
  shuffle(initialBid);
  shuffle(initialAsk);
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
  expect(
      buyPrice(orderBook, 1.252688885, 29969.09332).amount,
  ).toBeCloseTo(1.1476293, 5); // Google sheets calculated result
});

test('Buy Price fail when limit overpassed', () => {
  shuffle(initialBid);
  shuffle(initialAsk);
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
  expect(
      buyPrice(orderBook, 17.47, 30062).status,
  ).toStrictEqual('Failed'); // Google sheets calculated result
});

test('Sell Price no cap reached', () => {
  shuffle(initialBid);
  shuffle(initialAsk);
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
  expect(
      sellPrice(orderBook, 1.27182171, 29946.98129).efectivePrice,
  ).toBeCloseTo(29946.98921, 5); // Google sheets calculated result
});

test('Sell Price cap reached', () => {
  shuffle(initialBid);
  shuffle(initialAsk);
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
  expect(
      sellPrice(orderBook, 1.27182171, 29948.44993).amount,
  ).toBeCloseTo(1.0705354, 5); // Google sheets calculated result
});

test('Buy Price fail when limit overpassed', () => {
  shuffle(initialBid);
  shuffle(initialAsk);
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
  expect(
      sellPrice(orderBook, 5.37, 29902.96).status,
  ).toStrictEqual('Failed'); // Google sheets calculated result
});

