import dotenv from 'dotenv';

dotenv.config();

import { pool } from '../db/client';
import { runMigrations } from '../db/migrate';
import { projectStore } from '../services/projectStore';
import { ProjectRunnerEngine } from '../engine/projectRunner';

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_MAX_BATCHES = 20;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

async function processRemainingProjects(): Promise<number> {
  const batchSize = parsePositiveInt(process.env.RUN_REMAINING_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const maxBatches = parsePositiveInt(process.env.RUN_REMAINING_MAX_BATCHES, DEFAULT_MAX_BATCHES);

  let totalProcessed = 0;

  for (let batch = 1; batch <= maxBatches; batch += 1) {
    const remaining = await projectStore.getIncompleteRunningProjects(batchSize);
    if (remaining.length === 0) {
      break;
    }

    console.log(`[RunRemaining] Processing batch ${batch}/${maxBatches} (${remaining.length} project(s))`);

    for (const project of remaining) {
      console.log(`[RunRemaining] Reprocessing project ${project.id}`);
      await projectStore.clearStages(project.id);
      await projectStore.update(project.id, {
        status: 'running',
        completedAt: undefined,
        finalOutput: undefined,
      });

      const runner = new ProjectRunnerEngine(project.id, project.spec);
      await runner.run();
      totalProcessed += 1;
    }
  }

  return totalProcessed;
}

async function main(): Promise<void> {
  try {
    await runMigrations();
    const processed = await processRemainingProjects();
    console.log(`[RunRemaining] Done. Processed ${processed} project(s).`);
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('[RunRemaining] Failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('[RunRemaining] Crashed:', error);
  await pool.end();
  process.exit(1);
});
