const cors = require('cors');
const sio = require('socket.io');
const express = require('express');
const bodyParser = require('body-parser');
const MarketStatus = require('./market_status');

const marketStatus = new MarketStatus();

// API REST

const app = express();
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

app.listen(process.env.PORT || 5000, () => {
  console.log('App aviable on http://localhost:5000');
});

// WEWSocket

const io = sio(process.env.PORT + 1 || 5001, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  socket.on('tips', (currencyPair) => {
    socket.emit('tips-response', marketStatus.processTipsReq(currencyPair));
  });

  socket.on('calculate-price',
      (currencyPair, operation, amount, cap = undefined) => {
        if ( !currencyPair || !operation || ! amount) {
          socket.emit('calculate-price-response', {
            status: 'error',
            // eslint-disable-next-line max-len
            message: 'body must include currencyPair operation and amount (cap optional)',
          });
          return;
        }
        socket.emit('calculate-price-response',
            marketStatus.processCalPriReq(currencyPair, operation, amount, cap),
        );
      });
});
