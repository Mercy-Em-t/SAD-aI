import { NextFunction, Request, Response } from 'express';
import { authStore, User } from '../services/authStore';

const BEARER_PREFIX = 'Bearer ';

export function requireAuth(req: Request, res: Response, next: NextFunction): Response | void {
  const authHeader = req.header('Authorization');
  if (!authHeader?.startsWith(BEARER_PREFIX)) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = authStore.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}
