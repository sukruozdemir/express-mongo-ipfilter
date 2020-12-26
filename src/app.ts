// tslint:disable-next-line: no-var-requires
require('dotenv').config();

import cors from 'cors';
import express, { NextFunction, Request, Response, Router } from 'express';
import ipFilter from 'express-ipfilter';
import { Server } from 'http';
import httpStatus from 'http-status';
import ip from 'ip';
import mongoose from 'mongoose';
import morgan from 'morgan';
import responseTime from 'response-time';

import * as homeController from './controller';
import { ApiError } from './api-error';
import { errorConverter, errorHandler } from './error-middleware';
import { logger } from './logger';
import BlockedIp from './models/BlockedIp';

let server: Server = null;
const app = express();
const router = Router();

// IP filter middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  BlockedIp.find((err, docs) => {
    if (!err) {
      const ips = docs.map((doc: any) => ip.toString(doc.ip));
      ipFilter.IpFilter(ips, { mode: 'deny', log: false })(req, res, next);
    } else {
      logger.error(`IP filter error ${err}`);
    }
  });
});

app.use(responseTime());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.options('*', cors());

/**
 * Block endpoint
 */
router.post('/block', homeController.block);

/**
 * Unblock endpoint
 */
router.post('/unblock', homeController.unblock);

/**
 * Register router
 */
app.use('/', router);

// Send back a 404 error for any unknown api request
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

mongoose
  .connect(process.env.MONGODB_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    logger.info('Connected to MongoDB');

    // convert error to ApiError, if needed
    app.use(errorConverter);

    // handle error
    app.use(errorHandler);

    server = app.listen(process.env.PORT, () => {
      logger.info(`App listening on port number: ${process.env.PORT}`);
    });
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: any) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
