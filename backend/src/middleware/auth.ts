import { NextFunction, Request, Response } from 'express';
import { authStore } from '../services/authStore';

const BEARER_PREFIX = 'Bearer ';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'sad_genius_session';

function getCookieValue(req: Request, cookieName: string): string | null {
  const cookieHeader = req.header('Cookie');
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) continue;
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = part.slice(0, separatorIndex).trim();
    if (key !== cookieName) continue;
    const value = part.slice(separatorIndex + 1);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  const authHeader = req.header('Authorization') || '';
  const bearerToken = authHeader.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length).trim()
    : '';
  const cookieToken = getCookieValue(req, AUTH_COOKIE_NAME) || '';
  const token = bearerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await authStore.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}
