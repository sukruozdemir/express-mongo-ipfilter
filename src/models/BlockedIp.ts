import { model, Schema } from 'mongoose';

const blockedIpSchema = new Schema(
  {
    ip: {
      type: Buffer,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const BlockedIp = model('BlockedIp', blockedIpSchema);

export default BlockedIp;
