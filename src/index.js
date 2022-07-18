import RequestHandler from './req_handler.js';
import bodyParser from 'body-parser';
import logger from './logger.js';
import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import cors from 'cors';

const app = express();

const server = http.createServer(app);
const wss = new WebSocket.Server( {server} );

const requestHandler = new RequestHandler(logger);

// API REST

app.use(bodyParser.json());
app.use(cors());

app.get('/tips/*', async (request, response) => {
  const cp = request.url.replace('/tips/', '');
  const res = await requestHandler.processTipsReq(cp);
  const code = res.status === 'success' ? 200 : 400;
  response.status(code).json(res);
});

app.post('/calculate-price', async (request, response) => {
  const {currencyPair, operation, amount, cap = undefined} = request.body;
  if ( !currencyPair || !operation || ! amount) {
    return response.status(400).json( {
      status: 'error',
      // eslint-disable-next-line max-len
      message: 'body must include currencyPair operation and amount (cap optional)',
    });
  }

  const res = await requestHandler.processCalPriReq(
      currencyPair,
      operation,
      amount,
    cap === '' ? undefined : cap,
  );
  const code = res.status === 'success' ? 200 : 400;
  response.status(code).json(res);
});

// WEWSocket

wss.on('connection', (socket) => {
  socket.addEventListener('message', async (event) => {
    const data = JSON.parse(event.data);

    if (data.method === 'tips') {
      return socket.send( JSON.stringify( {
        method: 'tips-response',
        data: await requestHandler.processTipsReq(data.currencyPair),
      },
      ));
    }

    if (data.method === 'calculate-price') {
      if ( !data.currencyPair || !data.operation || ! data.amount) {
        return socket.send( JSON.stringify( {
          method: 'calculate-price-response',
          data: {
            status: 'error',
            // eslint-disable-next-line max-len
            message: 'body must include currencyPair operation and amount (cap optional)',
          },
        }));
      }

      return socket.send( JSON.stringify( {
        method: 'calculate-price-response',
        data: await requestHandler.processCalPriReq(
            data.currencyPair,
            data.operation,
            data.amount,
            data.cap === '' ? undefined : data.cap),
      }));
    }

    socket.send( JSON.stringify( {
      method: '',
      data: {message: 'Available methods: tips and calculate-price'},
    }));
  });
});

server.listen(process.env.PORT || 5000, () => {
  logger.info('App aviable on http://localhost:5000');
});
