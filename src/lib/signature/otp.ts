import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

const OTP_LENGTH = 6;
const OTP_HASH_ROUNDS = 10;

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * Used for the ADVANCED signature level (Lei 14.063/2020).
 */
export function generateOTP(): string {
  const lowerBound = 10 ** (OTP_LENGTH - 1);
  const upperBound = 10 ** OTP_LENGTH;
  return String(randomInt(lowerBound, upperBound));
}

/**
 * Hashes an OTP using bcrypt (10 rounds).
 * Hashing prevents database leaks from exposing valid OTPs
 * within their short-lived 10-minute window.
 */
export function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_HASH_ROUNDS);
}

/**
 * Verifies a plaintext OTP against its bcrypt hash.
 */
export function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
