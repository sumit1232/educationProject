import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'secure_jwt_access_secret_key_change_in_production_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'secure_jwt_refresh_secret_key_change_in_production_2026';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  name: string;
}

// 15-minute access token lifespan
export const ACCESS_TOKEN_EXPIRY = '15m';
export const ACCESS_TOKEN_MS = 15 * 60 * 1000;

// 7-day refresh token lifespan
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: TokenPayload): string {
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  // Store refresh token in db
  const expiresAt = Date.now() + REFRESH_TOKEN_MS;
  db.update('refreshTokens', (tokens) => [...tokens, { token, userId: payload.userId, expiresAt }]);
  return token;
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    // Check if refresh token is in active list
    const activeTokens = db.get('refreshTokens');
    const match = activeTokens.find((t) => t.token === token && t.expiresAt > Date.now());
    if (!match) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// Token Rotation: Invalidate used refresh token and issue new token pair
export function rotateTokens(oldRefreshToken: string): { accessToken: string; refreshToken: string; payload: TokenPayload } | null {
  const payload = verifyRefreshToken(oldRefreshToken);
  if (!payload) return null;

  // Invalidate old token
  db.update('refreshTokens', (tokens) => tokens.filter((t) => t.token !== oldRefreshToken));

  // Issue new pair
  const cleanPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };

  const newAccessToken = signAccessToken(cleanPayload);
  const newRefreshToken = signRefreshToken(cleanPayload);

  // Log audit
  db.update('auditLogs', (logs) => [
    {
      id: 'log-' + crypto.randomUUID().slice(0, 8),
      action: 'TOKEN_ROTATED',
      userEmail: payload.email,
      role: payload.role,
      ip: 'internal',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      details: 'Old refresh token revoked; new token pair issued',
    },
    ...logs.slice(0, 99),
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, payload: cleanPayload };
}

// Revoke on logout
export function revokeRefreshToken(token: string) {
  db.update('refreshTokens', (tokens) => tokens.filter((t) => t.token !== token));
}

export function revokeAllUserTokens(userId: string) {
  db.update('refreshTokens', (tokens) => tokens.filter((t) => t.userId !== userId));
}
