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
});

if (process.env.NODE_ENV !== 'PRODUCTION') {
  logger.add(new transports.Console({format: myFormat}));
  logger.level = 'debug';
} else {
  logger.add(new transports.File({filename: 'log/markket_status.log'}));
}

export default logger;
