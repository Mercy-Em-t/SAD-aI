import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ProjectRunnerEngine } from '../engine/projectRunner';
import { projectStore } from '../services/projectStore';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

function requireAuthenticatedUser(req: Request, res: Response): { id: string; email: string } | null {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return req.user;
}

const SpecFormSchema = z.object({
  projectName: z.string().min(1),
  description: z.string().min(1),
  projectType: z.string().min(1),
  targetUsers: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  modules: z.array(z.string()).optional(),
  integrations: z.array(z.string()).optional(),
  outputExpectations: z.array(z.string()).optional(),
});

// GET /api/projects - list all projects
router.get('/', async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  const projects = await projectStore.getAllByUser(user.id);
  res.json({ projects });
});

// GET /api/projects/:id - get project detail
router.get('/:id', async (req: Request, res: Response) => {
  const user = requireAuthenticatedUser(req, res);
  if (!user) return;
  const project = await projectStore.getById(req.params.id);
  if (!project || project.userId !== user.id) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ project });
});

// POST /api/projects - create and run a new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = requireAuthenticatedUser(req, res);
    if (!user) return;
    const spec = SpecFormSchema.parse(req.body);
    const projectId = uuidv4();
    
    const project = await projectStore.create({
      id: projectId,
      userId: user.id,
      name: spec.projectName,
      status: 'running',
      spec,
      stages: [],
      createdAt: new Date().toISOString(),
    });

    // Run pipeline asynchronously
    const runner = new ProjectRunnerEngine(projectId, spec);
    runner.run().catch(async (err: unknown) => {
      console.error(`[Runner] Project ${projectId} failed:`, err);
      await projectStore.update(projectId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
      });
    });

    res.status(201).json({ project });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
