import { randomBytes } from 'crypto';

export const generateRandomString = (length: number): string => {
  return randomBytes(length).toString('base64url').substring(0,length);
};

export const getTimeInSeconds = (date = new Date(Date.now())): number =>
  Math.round(date.getTime() / 1000);
