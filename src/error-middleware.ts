import { NextFunction, Request, Response } from 'express';
import { IpDeniedError } from 'express-ipfilter';
import httpStatus from 'http-status';

import { ApiError } from './api-error';
import { logger } from './logger';

interface ResponseError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorConverter = (
  err: ApiError | ResponseError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    if (error instanceof IpDeniedError) {
      const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
      error = new ApiError(statusCode, 'Access denied', error.isOperational);
    } else {
      const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || httpStatus[statusCode].toString();
      error = new ApiError(statusCode, message, false, err.stack);
    }
  }
  next(error);
};

export const errorHandler = (
  err: ApiError | ResponseError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { statusCode, message } = err;
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR].toString();
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};
