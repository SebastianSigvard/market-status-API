// import OrderBook from '../src/core/entity/order_book';
import OrderBook from '../src/core/entity/order_book.js';
import {initialBid, initialAsk} from './helpers';
const orderBook = new OrderBook(25);

test('Init order book', () => {
  expect(
      orderBook.init(initialBid, initialAsk) == undefined,
  ).toBe(true);
});

// eslint-disable-next-line
const update_bid_1 = [ { quantity: '0', rate: '29936.90800000' }, { quantity: '11.91600000', rate: '29771.49400000' }];
// eslint-disable-next-line
const update_ask_1 = [ { quantity: '0', rate: '29978.85000000' }, { quantity: '0.00984084', rate: '30095.41400000' } ];

test('Update 1', () => {
  expect(
      orderBook.update(update_bid_1, update_ask_1) == undefined,
  ).toBe(true);
});

// eslint-disable-next-line
const update_bid_2 = [{ quantity: '0.00200000', rate: '29936.90500000' },{ quantity: '0', rate: '29771.49400000' }];
// eslint-disable-next-line
const update_ask_2 = [{ quantity: '0.00400000', rate: '29978.84700000' },{ quantity: '0', rate: '30095.41400000' }];

test('Update 2', () => {
  expect(
      orderBook.update(update_bid_2, update_ask_2) == undefined,
  ).toBe(true);
});

// eslint-disable-next-line
const update_bid_3 = [{ quantity: '0', rate: '29945.88400000' },{ quantity: '0', rate: '29936.90500000' },{ quantity: '11.91600000', rate: '29771.49400000' },{ quantity: '0.00011056', rate: '29695.64700000' }];
// eslint-disable-next-line
const update_ask_3 = [{ quantity: '0', rate: '29978.84700000' },{ quantity: '0', rate: '30034.54600000' },{ quantity: '0.00984084', rate: '30095.41400000' },{ quantity: '0.56495122', rate: '30150.00000000' }];

test('Update 3', () => {
  expect(
      orderBook.update(update_bid_3, update_ask_3) == undefined,
  ).toBe(true);
});

// eslint-disable-next-line
const update_bid_4 = [{ quantity: '0.01600000', rate: '29945.88500000' },{ quantity: '0.00200000', rate: '29936.88600000' },{ quantity: '0', rate: '29771.49400000' },{ quantity: '0', rate: '29695.64700000' }];
// eslint-disable-next-line
const update_ask_4 = [{ quantity: '0.00400000', rate: '29978.82600000' },{ quantity: '0', rate: '30150.00000000' }];

test('Update 4', () => {
  expect(
      orderBook.update(update_bid_4, update_ask_4) == undefined,
  ).toBe(true);
});

const initFail = () => {
  try {
    // eslint-disable-next-line camelcase
    orderBook.init([...initialAsk].splice(1), [...initialBid].splice(1));
  } catch (error) {
    return error.code === 0;
  }
};

test('Throw init', () => {
  expect(
      initFail(),
  ).toBe(true);
});
