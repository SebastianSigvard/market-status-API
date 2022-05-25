const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const MarketStatus = require('./market_status');
const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');

const wss = new WebSocket.Server( {server} );
const marketStatus = new MarketStatus();

// API REST

app.use(bodyParser.json());
app.use(cors());

app.get('/tips/*', async (request, response) => {
  const cp = request.url.replace('/tips/', '');
  response.json(marketStatus.processTipsReq(cp));
});

app.post('/calculate-price', async (request, response) => {
  const {currencyPair, operation, amount, cap = undefined} = request.body;
  if ( !currencyPair || !operation || ! amount) {
    response.json( {
      status: 'error',
      // eslint-disable-next-line max-len
      message: 'body must include currencyPair operation and amount (cap optional)',
    });
    return;
  }
  response.json(
      marketStatus.processCalPriReq(currencyPair, operation, amount, cap),
  );
});

// WEWSocket

wss.on('connection', (socket) => {
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.method === 'tips') {
      socket.send( JSON.stringify( {
        method: 'tips-response',
        data: marketStatus.processTipsReq(data.currencyPair),
      },
      ));
      return;
    }

    if (data.method === 'calculate-price') {
      if ( !data.currencyPair || !data.operation || ! data.amount) {
        socket.send( JSON.stringify( {
          method: 'calculate-price-response',
          data: {
            status: 'error',
            // eslint-disable-next-line max-len
            message: 'body must include currencyPair operation and amount (cap optional)',
          },
        }));
        return;
      }
      socket.send( JSON.stringify( {
        method: 'calculate-price-response',
        data: marketStatus.processCalPriReq(data.currencyPair,
            data.operation, data.amount, data.cap),
      }));
      return;
    }

    socket.send( JSON.stringify( {
      method: '',
      data: {message: 'Available methods: tips and calculate-price'},
    }));
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log('App aviable on http://localhost:5000');
});
