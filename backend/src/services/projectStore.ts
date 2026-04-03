export interface StageOutput {
  stage: string;
  output: Record<string, unknown>;
  score: {
    completeness: number;
    clarity: number;
    standardCompliance: number;
  };
  completedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  status: 'running' | 'completed' | 'failed';
  spec: Record<string, unknown>;
  stages: StageOutput[];
  finalOutput?: FinalOutput;
  createdAt: string;
  completedAt?: string;
}

export interface FinalOutput {
  requirements: Record<string, unknown>;
  systemModel: Record<string, unknown>;
  design: Record<string, unknown>;
  testCases: Record<string, unknown>;
  documentation: Record<string, unknown>;
  diagrams: DiagramOutput[];
}

export interface DiagramOutput {
  type: string;
  title: string;
  mermaid: string;
}

import { query } from '../db/client';

const DEFAULT_INCOMPLETE_RUNNING_PROJECTS_LIMIT = 25;

class ProjectStore {
  async create(project: Project): Promise<Project> {
    await query(
      `INSERT INTO projects (id, user_id, name, status, spec, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [project.id, project.userId, project.name, project.status, JSON.stringify(project.spec), project.createdAt]
    );
    return project;
  }

  async getById(id: string): Promise<Project | undefined> {
    const projectResult = await query<{
      id: string;
      user_id: string;
      name: string;
      status: 'running' | 'completed' | 'failed';
      spec: Record<string, unknown>;
      final_output: FinalOutput | null;
      created_at: string;
      completed_at: string | null;
    }>(
      `SELECT id, user_id, name, status, spec, final_output, created_at, completed_at
       FROM projects
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    if (!projectResult.rowCount || projectResult.rowCount === 0) return undefined;
    const row = projectResult.rows[0];

    const stagesResult = await query<{
      stage: string;
      output_json: Record<string, unknown>;
      score_completeness: string | number | null;
      score_clarity: string | number | null;
      score_standard_compliance: string | number | null;
      completed_at: string;
    }>(
      `SELECT stage, output_json, score_completeness, score_clarity, score_standard_compliance, completed_at
       FROM stages
       WHERE project_id = $1
       ORDER BY completed_at ASC`,
      [id]
    );

    const stages: StageOutput[] = stagesResult.rows.map((stageRow) => ({
      stage: stageRow.stage,
      output: stageRow.output_json,
      score: {
        completeness: Number(stageRow.score_completeness ?? 0),
        clarity: Number(stageRow.score_clarity ?? 0),
        standardCompliance: Number(stageRow.score_standard_compliance ?? 0),
      },
      completedAt: new Date(stageRow.completed_at).toISOString(),
    }));

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      status: row.status,
      spec: row.spec,
      stages,
      finalOutput: row.final_output ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    };
  }

  async getAllByUser(userId: string): Promise<Project[]> {
    const projectsResult = await query<{
      id: string;
      user_id: string;
      name: string;
      status: 'running' | 'completed' | 'failed';
      spec: Record<string, unknown>;
      final_output: FinalOutput | null;
      created_at: string;
      completed_at: string | null;
    }>(
      `SELECT id, user_id, name, status, spec, final_output, created_at, completed_at
       FROM projects
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    if (projectsResult.rowCount === 0) return [];

    const ids = projectsResult.rows.map((project) => project.id);
    const stagesResult = await query<{
      project_id: string;
      stage: string;
      output_json: Record<string, unknown>;
      score_completeness: string | number | null;
      score_clarity: string | number | null;
      score_standard_compliance: string | number | null;
      completed_at: string;
    }>(
      `SELECT project_id, stage, output_json, score_completeness, score_clarity, score_standard_compliance, completed_at
       FROM stages
       WHERE project_id = ANY($1::uuid[])
       ORDER BY completed_at ASC`,
      [ids]
    );

    const stagesByProject = new Map<string, StageOutput[]>();
    for (const stageRow of stagesResult.rows) {
      const list = stagesByProject.get(stageRow.project_id) ?? [];
      list.push({
        stage: stageRow.stage,
        output: stageRow.output_json,
        score: {
          completeness: Number(stageRow.score_completeness ?? 0),
          clarity: Number(stageRow.score_clarity ?? 0),
          standardCompliance: Number(stageRow.score_standard_compliance ?? 0),
        },
        completedAt: new Date(stageRow.completed_at).toISOString(),
      });
      stagesByProject.set(stageRow.project_id, list);
    }

    return projectsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      status: row.status,
      spec: row.spec,
      stages: stagesByProject.get(row.id) ?? [],
      finalOutput: row.final_output ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    }));
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;
    const merged = { ...existing, ...updates };
    await query(
      `UPDATE projects
       SET name = $2,
           status = $3,
           spec = $4::jsonb,
           final_output = $5::jsonb,
           completed_at = $6
       WHERE id = $1`,
      [
        id,
        merged.name,
        merged.status,
        JSON.stringify(merged.spec),
        merged.finalOutput ? JSON.stringify(merged.finalOutput) : null,
        merged.completedAt ?? null,
      ]
    );
    return this.getById(id);
  }

  async addStage(id: string, stage: StageOutput): Promise<void> {
    await query(
      `INSERT INTO stages (
        project_id,
        stage,
        output_json,
        score_completeness,
        score_clarity,
        score_standard_compliance,
        completed_at
      ) VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)`,
      [
        id,
        stage.stage,
        JSON.stringify(stage.output),
        stage.score.completeness,
        stage.score.clarity,
        stage.score.standardCompliance,
        stage.completedAt,
      ]
    );
  }

  async getIncompleteRunningProjects(limit = DEFAULT_INCOMPLETE_RUNNING_PROJECTS_LIMIT): Promise<Project[]> {
    const safeLimit = Number.isFinite(limit) && limit > 0
      ? Math.floor(limit)
      : DEFAULT_INCOMPLETE_RUNNING_PROJECTS_LIMIT;
    const projectsResult = await query<{
      id: string;
      user_id: string;
      name: string;
      status: 'running' | 'completed' | 'failed';
      spec: Record<string, unknown>;
      final_output: FinalOutput | null;
      created_at: string;
      completed_at: string | null;
    }>(
      `SELECT id, user_id, name, status, spec, final_output, created_at, completed_at
       FROM projects
       WHERE status = 'running' AND completed_at IS NULL
       ORDER BY created_at ASC
       LIMIT $1`,
      [safeLimit]
    );

    if (projectsResult.rowCount === 0) return [];

    const ids = projectsResult.rows.map((project) => project.id);
    const stagesResult = await query<{
      project_id: string;
      stage: string;
      output_json: Record<string, unknown>;
      score_completeness: string | number | null;
      score_clarity: string | number | null;
      score_standard_compliance: string | number | null;
      completed_at: string;
    }>(
      `SELECT project_id, stage, output_json, score_completeness, score_clarity, score_standard_compliance, completed_at
       FROM stages
       WHERE project_id = ANY($1::uuid[])
       ORDER BY completed_at ASC`,
      [ids]
    );

    const stagesByProject = new Map<string, StageOutput[]>();
    for (const stageRow of stagesResult.rows) {
      const list = stagesByProject.get(stageRow.project_id) ?? [];
      list.push({
        stage: stageRow.stage,
        output: stageRow.output_json,
        score: {
          completeness: Number(stageRow.score_completeness ?? 0),
          clarity: Number(stageRow.score_clarity ?? 0),
          standardCompliance: Number(stageRow.score_standard_compliance ?? 0),
        },
        completedAt: new Date(stageRow.completed_at).toISOString(),
      });
      stagesByProject.set(stageRow.project_id, list);
    }

    return projectsResult.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      status: row.status,
      spec: row.spec,
      stages: stagesByProject.get(row.id) ?? [],
      finalOutput: row.final_output ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    }));
  }

  async clearStages(projectId: string): Promise<void> {
    await query('DELETE FROM stages WHERE project_id = $1', [projectId]);
  }
}

export const projectStore = new ProjectStore();
