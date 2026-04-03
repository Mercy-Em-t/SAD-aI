import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authStore } from '../services/authStore';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';

const router = Router();

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password } = CredentialsSchema.parse(req.body);
    const user = authStore.register(email, password);
    const token = authStore.issueToken(user.id);
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

router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = CredentialsSchema.parse(req.body);
    const user = authStore.login(email, password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const token = authStore.issueToken(user.id);
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

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  return res.json({ user: { id: req.user.id, email: req.user.email } });
});

export default router;
