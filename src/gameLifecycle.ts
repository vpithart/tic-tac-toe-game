import crypto from 'crypto';

const boardSize:Number = 8;

export function createGame() {
  const randomString = crypto.randomBytes(4).toString("hex");
  return randomString;
}
