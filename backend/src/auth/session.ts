import { Request, Response } from 'express';

const BEARER_PREFIX = 'Bearer ';
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'sad_genius_session';
const AUTH_COOKIE_MAX_AGE_MS = Number(process.env.AUTH_SESSION_DURATION_MS) > 0
  ? Number(process.env.AUTH_SESSION_DURATION_MS)
  : 2 * 60 * 60 * 1000;
const AUTH_COOKIE_SECURE = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_SAME_SITE = process.env.AUTH_COOKIE_SAME_SITE || 'lax';

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

function getSameSite(): 'lax' | 'strict' | 'none' {
  const normalized = AUTH_COOKIE_SAME_SITE.toLowerCase();
  if (normalized === 'strict' || normalized === 'none') return normalized;
  return 'lax';
}

export function getRequestToken(req: Request): string | null {
  const authHeader = req.header('Authorization') || '';
  const bearerToken = authHeader.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length).trim()
    : '';
  const cookieToken = getCookieValue(req, AUTH_COOKIE_NAME) || '';
  return bearerToken || cookieToken || null;
}

export function setAuthCookie(res: Response, token: string): void {
  const sameSite = getSameSite();
  const attributes = [
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${Math.floor(AUTH_COOKIE_MAX_AGE_MS / 1000)}`,
    `SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`,
  ];
  if (AUTH_COOKIE_SECURE || sameSite === 'none') {
    attributes.push('Secure');
  }
  res.setHeader('Set-Cookie', attributes.join('; '));
}

export function clearAuthCookie(res: Response): void {
  const sameSite = getSameSite();
  const attributes = [
    `${AUTH_COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    `SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite.slice(1)}`,
  ];
  if (AUTH_COOKIE_SECURE || sameSite === 'none') {
    attributes.push('Secure');
  }
  res.setHeader('Set-Cookie', attributes.join('; '));
}
