import {createLogger, transports, format} from 'winston';

const myFormat = format.combine(format.timestamp(),
    format.printf( ({level, message, timestamp, ...metadata}) => {
      // eslint-disable-next-line max-len
      let msg = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ~ ${message} `;
      if ( Object.keys(metadata).length) {
        msg += JSON.stringify(metadata);
      }
      return msg;
    }));

const logger = createLogger({
  format: myFormat,
  level: 'info',
  transports: [
    new transports.Console(),
  ],
});

module.exports = logger;
