import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authStore } from '../services/authStore';
import { requireAuth } from '../middleware/auth';

const router = Router();
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'sad_genius_session';
const AUTH_COOKIE_MAX_AGE_MS = Number(process.env.AUTH_SESSION_DURATION_MS) > 0
  ? Number(process.env.AUTH_SESSION_DURATION_MS)
  : 2 * 60 * 60 * 1000;
const AUTH_COOKIE_SECURE = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_SAME_SITE = process.env.AUTH_COOKIE_SAME_SITE || 'lax';

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function requireAuthenticatedUser(req: Request, res: Response): { id: string; email: string } | null {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return req.user;
}

function setAuthCookie(res: Response, token: string): void {
  const sameSite = AUTH_COOKIE_SAME_SITE.toLowerCase() as 'lax' | 'strict' | 'none';
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

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = CredentialsSchema.parse(req.body);
    const user = await authStore.register(email, password);
    const token = await authStore.issueToken(user.id);
    setAuthCookie(res, token);
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    if (err instanceof Error && err.message === 'Email already registered') {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = CredentialsSchema.parse(req.body);
    const user = await authStore.login(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const token = await authStore.issueToken(user.id);
    setAuthCookie(res, token);
    return res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  return res.json({ user: { id: user.id, email: user.email } });
});

export default router;
