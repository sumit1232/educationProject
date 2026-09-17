import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../db';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, RateLimitStore>();

export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Too many requests. Please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
    const now = Date.now();

    const record = ipBuckets.get(ip);

    if (!record || now > record.resetAt) {
      ipBuckets.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= max) {
      // Record rate limit security breach in audit logs
      db.update('auditLogs', (logs) => [
        {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          action: 'RATE_LIMIT_EXCEEDED',
          userEmail: req.body?.email || 'anonymous',
          role: 'unknown',
          ip,
          timestamp: new Date().toISOString(),
          status: 'WARNING',
          details: `Rate limit hit: ${record.count} reqs on endpoint ${req.originalUrl}`,
        },
        ...logs.slice(0, 99),
      ]);

      res.status(429).json({
        success: false,
        message,
        code: 'RATE_LIMITED',
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
      });
      return;
    }

    record.count++;
    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts from this IP. Please wait 15 minutes before retrying.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'API rate limit exceeded. Please slow down.',
});
