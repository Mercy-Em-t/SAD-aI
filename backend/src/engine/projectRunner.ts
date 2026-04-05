import { RequirementsAgent } from '../agents/requirementsAgent';
import { ModelingAgent } from '../agents/modelingAgent';
import { DesignAgent } from '../agents/designAgent';
import { TestingAgent } from '../agents/testingAgent';
import { DocumentationAgent } from '../agents/documentationAgent';
import { diagramEngine } from '../services/diagramEngine';
import { projectStore } from '../services/projectStore';
import { ProjectSpec, FinalProjectOutput } from '../types/models';

const QUALITY_THRESHOLD = 7;
const MAX_RETRIES = 2;

export class ProjectRunnerEngine {
  private projectId: string;
  private spec: ProjectSpec;
  private context: any = {};

  private requirementsAgent = new RequirementsAgent();
  private modelingAgent = new ModelingAgent();
  private designAgent = new DesignAgent();
  private testingAgent = new TestingAgent();
  private documentationAgent = new DocumentationAgent();

  constructor(projectId: string, spec: ProjectSpec) {
    this.projectId = projectId;
    this.spec = spec;
  }

  async run(): Promise<void> {
    try {
      console.log(`[Runner] Starting project ${this.projectId}`);

      // Stage 1: Requirements
      const requirementsResult = await this.runWithRetry(
        'requirements',
        () => this.requirementsAgent.run(this.spec)
      );
      this.context.requirements = requirementsResult.output;

      // Stage 2: Modeling
      const modelingResult = await this.runWithRetry(
        'modeling',
        () => this.modelingAgent.run(this.spec, this.context)
      );
      this.context.model = modelingResult.output;

      // Stage 3: Design
      const designResult = await this.runWithRetry(
        'design',
        () => this.designAgent.run(this.spec, this.context)
      );
      this.context.design = designResult.output;

      // Stage 4: Testing
      const testingResult = await this.runWithRetry(
        'testing',
        () => this.testingAgent.run(this.spec, this.context)
      );
      this.context.testing = testingResult.output;

      // Stage 5: Documentation
      const documentationResult = await this.runWithRetry(
        'documentation',
        () => this.documentationAgent.run(this.spec, this.context)
      );
      this.context.documentation = documentationResult.output;

      // Generate diagrams from model
      const diagrams = diagramEngine.generateDiagrams(this.context.model as any);

      // Compile final output
      const finalOutput: FinalProjectOutput = {
        requirements: requirementsResult.output as any,
        systemModel: modelingResult.output as any,
        design: designResult.output as any,
        testCases: testingResult.output as any,
        documentation: documentationResult.output as any,
        diagrams,
      };

      await projectStore.update(this.projectId, {
        status: 'completed',
        finalOutput,
        completedAt: new Date().toISOString(),
      });

      console.log(`[Runner] Project ${this.projectId} completed successfully`);
    } catch (err) {
      console.error(`[Runner] Project ${this.projectId} failed:`, err);
      await projectStore.update(this.projectId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
      });
    }
  }

  private async runWithRetry(
    stageName: string,
    agentFn: () => Promise<{ output: any; score: { completeness: number; clarity: number; standardCompliance: number } }>
  ): Promise<{ output: any; score: { completeness: number; clarity: number; standardCompliance: number } }> {
    let result = await agentFn();
    let attempts = 1;

    let avgScore = (result.score.completeness + result.score.clarity + result.score.standardCompliance) / 3;

    while (avgScore < QUALITY_THRESHOLD && attempts < MAX_RETRIES) {
      console.log(`[Runner] Stage ${stageName} quality score ${avgScore} below threshold, retrying...`);
      result = await agentFn();
      avgScore = (result.score.completeness + result.score.clarity + result.score.standardCompliance) / 3;
      attempts++;
    }

    await projectStore.addStage(this.projectId, {
      stage: stageName,
      output: result.output,
      score: result.score,
      completedAt: new Date().toISOString(),
    });

    return result;
  }
}
