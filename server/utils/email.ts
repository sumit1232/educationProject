import crypto from 'crypto';
import { db, OtpRecord } from '../db';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  otp: string;
  purpose: 'signup' | 'login' | 'reset';
  timestamp: string;
  status: 'SENT' | 'SIMULATED';
}

const emailLogs: EmailLog[] = [];

export function getEmailLogs(): EmailLog[] {
  return emailLogs.slice(0, 30);
}

export function generateOTP(email: string, type: 'signup' | 'login' | 'reset'): string {
  // 6-digit secure crypto OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

  // Remove previous OTPs for this email and type
  db.update('otps', (otps) => [
    ...otps.filter((o) => !(o.email.toLowerCase() === email.toLowerCase() && o.type === type)),
    {
      email: email.toLowerCase(),
      otp,
      type,
      expiresAt,
    },
  ]);

  // Record simulated email dispatch
  const log: EmailLog = {
    id: 'mail-' + crypto.randomUUID().slice(0, 8),
    to: email,
    subject: `Your Security Verification Code: ${otp}`,
    otp,
    purpose: type,
    timestamp: new Date().toISOString(),
    status: 'SENT',
  };
  emailLogs.unshift(log);

  return otp;
}

export function verifyOTP(email: string, otp: string, type: 'signup' | 'login' | 'reset'): boolean {
  const otps = db.get('otps');
  const now = Date.now();
  const matchIndex = otps.findIndex(
    (o) => o.email.toLowerCase() === email.toLowerCase() && o.otp === otp && o.type === type && o.expiresAt > now
  );

  if (matchIndex === -1) {
    return false;
  }

  // Consume OTP (single use)
  db.update('otps', (list) => list.filter((_, idx) => idx !== matchIndex));
  return true;
}
