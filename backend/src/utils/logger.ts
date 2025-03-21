import winston from 'winston';
import path from 'path';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

// Create log directory if it doesn't exist
const logDir = 'logs';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const developmentTransports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error'
  }),
  new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
];

const productionTransports = [
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error'
  }),
  new winston.transports.File({ filename: path.join(logDir, 'combined.log') })
];

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels: logLevels,
  format,
  transports:
    process.env.NODE_ENV === 'development'
      ? developmentTransports
      : productionTransports
});

// Create a stream object for Morgan integration
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

export { logger, stream };