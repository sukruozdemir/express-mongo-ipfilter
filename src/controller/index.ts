import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import httpStatus from 'http-status';
import ip from 'ip';

import { ApiError } from '../api-error';
import BlockedIp from '../models/BlockedIp';

export const block = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ip: blockIp }: { ip: string } = req.body;

    const ipBuffer = ip.toBuffer(blockIp);
    const checkResult = await BlockedIp.findOne({ ip: ipBuffer });
    if (checkResult)
      throw new ApiError(httpStatus.BAD_REQUEST, 'IP address already blocked');

    const blockedIp = new BlockedIp({
      ip: ipBuffer,
    });
    await blockedIp.save();

    return res.json({ message: 'IP address blocked' });
  },
);

export const unblock = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ip: blockIp }: { ip: string } = req.body;
    const ipBuffer = ip.toBuffer(blockIp);

    const checkResult = await BlockedIp.findOne({ ip: ipBuffer });
    if (!checkResult)
      throw new ApiError(httpStatus.BAD_REQUEST, 'IP address is not blocked');

    await BlockedIp.deleteOne({ ip: ipBuffer });
    return res.status(httpStatus.OK).json({ message: 'IP address unblocked' });
  },
);
