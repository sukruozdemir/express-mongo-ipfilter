import winston from 'winston';

const options = {
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transports: [new winston.transports.Console(options.console)],
  exitOnError: false,
});

export { logger };
