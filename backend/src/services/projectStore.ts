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

class ProjectStore {
  private projects: Map<string, Project> = new Map();

  create(project: Project): Project {
    this.projects.set(project.id, project);
    return project;
  }

  getById(id: string): Project | undefined {
    return this.projects.get(id);
  }

  getAllByUser(userId: string): Project[] {
    return Array.from(this.projects.values())
      .filter((project) => project.userId === userId)
      .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  update(id: string, updates: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    const updated = { ...project, ...updates };
    this.projects.set(id, updated);
    return updated;
  }

  addStage(id: string, stage: StageOutput): void {
    const project = this.projects.get(id);
    if (project) {
      project.stages.push(stage);
    }
  }
}

export const projectStore = new ProjectStore();
