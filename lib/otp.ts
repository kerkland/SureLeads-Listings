import redis from './redis';
import crypto from 'crypto';

const OTP_TTL = 5 * 60; // 5 minutes
const OTP_PREFIX = 'otp:';

export function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function storeOtp(phone: string, otp: string): Promise<void> {
  await redis.setex(`${OTP_PREFIX}${phone}`, OTP_TTL, otp);
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const stored = await redis.get(`${OTP_PREFIX}${phone}`);
  if (!stored || stored !== otp) return false;
  await redis.del(`${OTP_PREFIX}${phone}`);
  return true;
}
