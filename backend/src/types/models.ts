export interface ProjectSpec {
  projectName: string;
  description: string;
  projectType: string;
  targetUsers?: string;
  requirements?: string[];
  modules?: string[];
  integrations?: string[];
  outputExpectations?: string[];
  guidanceEnabled?: boolean;
}

export interface RequirementSet {
  functional: string[];
  nonFunctional: string[];
  userStories: string[];
  constraints: string[];
}

export interface EntityField {
  name: string;
  type: string;
  description: string;
}

export interface EntityRelationship {
  target: string;
  type: string;
  description: string;
}

export interface Entity {
  name: string;
  fields: EntityField[];
  relationships: EntityRelationship[];
}

export interface UseCase {
  id: string;
  name: string;
  actors: string[];
  description: string;
  flow: string[];
}

export interface SystemModel {
  entities: Entity[];
  useCases: UseCase[];
  logic: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  requestBody?: Record<string, any>;
  responses: Record<string, any>;
}

export interface TechnicalDesign {
  architecture: string;
  components: string[];
  databaseSchema: string;
  apiEndpoints: APIEndpoint[];
}

export interface TestPlan {
  unitTests: string[];
  integrationTests: string[];
  e2eTests: string[];
  securityTests: string[];
}

export interface DocumentationBundle {
  summary: string;
  deploymentGuide: string;
  userManual: string;
}

export interface DiagramOutput {
  type: string;
  title: string;
  mermaid: string;
}

export interface FinalProjectOutput {
  requirements: RequirementSet;
  systemModel: SystemModel;
  design: TechnicalDesign;
  testCases: TestPlan;
  documentation: DocumentationBundle;
  diagrams: DiagramOutput[];
}

export interface ProjectStage {
  stage: string;
  output: any;
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
  status: 'running' | 'completed' | 'failed' | 'pending_guidance';
  spec: ProjectSpec;
  stages: ProjectStage[];
  finalOutput?: FinalProjectOutput;
  createdAt: string;
  completedAt?: string;
}
