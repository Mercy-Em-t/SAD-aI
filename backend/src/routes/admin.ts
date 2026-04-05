import { Router, Request, Response } from 'express';
import { authStore } from '../services/authStore';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes here require both auth and admin role
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/admin/users - List all users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await authStore.getAllUsers();
    return res.json({ users });
  } catch (err) {
    console.error('Admin Fetch Users Error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/balance - Update user balance
router.post('/users/:id/balance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { delta } = req.body; // e.g., { delta: 10 } or { delta: -5 }
    
    if (typeof delta !== 'number') {
      return res.status(400).json({ error: 'Delta must be a number' });
    }

    await authStore.updateBalance(id, delta);
    return res.json({ message: 'Balance updated successfully' });
  } catch (err) {
    console.error('Admin Update Balance Error:', err);
    return res.status(500).json({ error: 'Failed to update balance' });
  }
});

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // { role: 'admin' | 'user' }
    
    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await authStore.setRole(id, role);
    return res.json({ message: 'Role updated successfully' });
  } catch (err) {
    console.error('Admin Update Role Error:', err);
    return res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
