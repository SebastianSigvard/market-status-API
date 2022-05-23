const BittrexSocket = require('./bittrex_socket_listener');
const ObmProcessor = require('./obm_processor');
const OrderBook = require('./order_book');

const url = 'wss://socket-v3.bittrex.com/signalr';
const hub = ['c3'];
const apikey = '7379583862cc43d9b5a2b2ee550452d1';
const apisecret = 'cc3bdafb64704d20a2413a78fea01be8';

const OB_DEPTH = 25;

const bittrexSocket = new BittrexSocket(url, hub, apikey, apisecret);
const orderBook = new OrderBook(OB_DEPTH, 'BTC-USD');
const obmProcessor = new ObmProcessor([orderBook]);

const channels = [
  'orderbook_BTC-USD_' + OB_DEPTH,
  // 'orderbook_ETH-USD_' + OB_DEPTH,
];

bittrexSocket.connect(obmProcessor.messageProcesor).then( () => {
  bittrexSocket.subscribe(channels);
});
