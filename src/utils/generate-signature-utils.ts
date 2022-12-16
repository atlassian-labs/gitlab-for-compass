import { randomBytes } from 'crypto';

export const generateSignature = () => {
  return randomBytes(256).toString('hex');
};
