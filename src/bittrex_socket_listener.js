/*
 * Last tested 2020/09/24 on node v12.16.3.
 *
 * Note: This file is intended solely for testing purposes and may only be used
 *   as an example to debug and compare with your code. The 3rd party libraries
 *   used in this example may not be suitable for your production use cases.
 *   You should always independently verify the security and suitability of any
 *   3rd party library used in your code.
 *
 */

const signalR = require('signalr-client');
const zlib = require('zlib');
const crypto = require('crypto');
const uuid = require('uuid');

const url = 'wss://socket-v3.bittrex.com/signalr';
const hub = ['c3'];

const apikey = '7379583862cc43d9b5a2b2ee550452d1';
const apisecret = 'cc3bdafb64704d20a2413a78fea01be8';

let client;
let resolveInvocationPromise = () => { };

/**
 * Main func.
 */
async function main() {
  client = await connect();
  if (apisecret) {
    await authenticate(client);
  } else {
    console.log('Authentication skipped because API key was not provided');
  }
  await subscribe(client);
}

/**
 * Connects websocket to bittrex.
 * @return client instance.
 */
async function connect() {
  return new Promise((resolve) => {
    // eslint-disable-next-line new-cap
    const client = new signalR.client(url, hub);
    client.serviceHandlers.messageReceived = messageReceived;
    client.serviceHandlers.connected = () => {
      console.log('Connected');
      return resolve(client);
    };
  });
}

/**
 * Authenticates the client.
 * @param {int} client client instance.
 */
async function authenticate(client) {
  const timestamp = new Date().getTime();
  const randomContent = uuid.v4();
  const content = `${timestamp}${randomContent}`;
  const signedContent = crypto.createHmac('sha512', apisecret)
      .update(content).digest('hex').toUpperCase();

  const response = await invoke(client, 'authenticate',
      apikey,
      timestamp,
      randomContent,
      signedContent);

  if (response['Success']) {
    console.log('Authenticated');
  } else {
    console.log('Authentication failed: ' + response['ErrorCode']);
  }
}

/**
 * Suscribe for a especific stream.
 * @param {int} client client instance.
 */
async function subscribe(client) {
  const channels = [
    'heartbeat',
    'trade_BTC-USD',
    'orderbook_BTC-USD_25',
    'balance',
  ];
  const response = await invoke(client, 'subscribe', channels);

  for (let i = 0; i < channels.length; i++) {
    if (response[i]['Success']) {
      console.log('Subscription to "' + channels[i] + '" successful');
    } else {
      console.log('Subscription to "' + channels[i] + '" failed: ' +
                  response[i]['ErrorCode']);
    }
  }
}

/**
 * Call a method for a client with the specified args.
 * @param {int} client The second number.
 * @param {int} method
 * @return A promise that will resolve when response is recieved or in err case.
 */
async function invoke(client, method, ...args) {
  return new Promise((resolve, reject) => {
    resolveInvocationPromise = resolve;
    // Promise will be resolved when response message received

    client.call(hub[0], method, ...args)
        .done(function(err) {
          if (err) {
            return reject(err);
          }
        });
  });
}


/**
 * The message handler.
 * @param {int} message Incoming message.
 */
function messageReceived(message) {
  console.log(message);
  const data = JSON.parse(message.utf8Data);
  if (data['R']) {
    resolveInvocationPromise(data.R);
  } else if (data['M']) {
    data.M.forEach(function(m) {
      if (m['A']) {
        if (m.A[0]) {
          const b64 = m.A[0];
          // eslint-disable-next-line new-cap
          const raw = new Buffer.from(b64, 'base64');

          zlib.inflateRaw(raw, function(err, inflated) {
            if (!err) {
              const json = JSON.parse(inflated.toString('utf8'));
              console.log(m.M + ': ');
              console.log(json);
            }
          });
        } else if (m.M == 'heartbeat') {
          console.log('\u2661');
        } else if (m.M == 'authenticationExpiring') {
          console.log('Authentication expiring...');
          authenticate(client);
        }
      }
    });
  }
}

main();
