const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = format;

const logFmt = printf(({ level, message, timestamp, stack }) =>
  `${timestamp} [${level}]: ${stack || message}`
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFmt),
  transports: [
    new transports.Console({ format: combine(colorize(), logFmt) }),
    new transports.File({ filename: path.join(__dirname, '../../logs/error.log'),  level: 'error' }),
    new transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
  ],
});

// Add http level
logger.http = (msg) => logger.log('http', msg);

module.exports = logger;