const BittrexSocket = require('./bittrex_socket_listener');

const url = 'wss://socket-v3.bittrex.com/signalr';
const hub = ['c3'];

const apikey = '7379583862cc43d9b5a2b2ee550452d1';
const apisecret = 'cc3bdafb64704d20a2413a78fea01be8';

const bittrexSocket = new BittrexSocket(url, hub, apikey, apisecret);

bittrexSocket.connect().then( () => {
  bittrexSocket.subscribe();
});
