const express = require('express');
const MarketStatus = require('./market_status');

const marketStatus = new MarketStatus();

const app = express();
app.use(express.static('./public'));


app.get('/tips/*', async (request, response) => {
  const cp = request.url.replace('/tips/', '');
  response.json(marketStatus.processTipsReq(cp));
});


app.listen(process.env.PORT || 5000, () => {
  console.log('App aviable on http://localhost:5000');
});
