const express = require('express');
const bodyParser = require('body-parser');
const MarketStatus = require('./market_status');

const marketStatus = new MarketStatus();

const app = express();
app.use(bodyParser.json());


app.get('/tips/*', async (request, response) => {
  const cp = request.url.replace('/tips/', '');
  response.json(marketStatus.processTipsReq(cp));
});

app.post('/calculate-price', async (request, response) => {
  const {currencyPair, operation, amount, cap = Infinity} = request.body;
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
