import crypto from 'crypto';

export function createGame() {
  const randomString = crypto.randomBytes(4).toString("hex");
  return randomString;
}
