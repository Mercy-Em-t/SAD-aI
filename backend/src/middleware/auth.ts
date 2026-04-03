import { NextFunction, Request, Response } from 'express';
import { authStore } from '../services/authStore';
import { getRequestToken } from '../auth/session';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  const token = getRequestToken(req);

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
