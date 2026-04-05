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

      // SaaS: Fetch Knowledge Base context
      const kbContent = await projectStore.getKnowledgeBase(this.spec.userId);
      this.context.knowledgeBase = kbContent;

      // Stage 1: Requirements
      const requirementsResult = await this.runWithRetry(
        'requirements',
        () => this.requirementsAgent.run(this.spec, this.context)
      );
      this.context.requirements = requirementsResult.output;
      if (this.spec.guidanceEnabled) await this.waitForGuidance('requirements');

      // Stage 2: Modeling
      const modelingResult = await this.runWithRetry(
        'modeling',
        () => this.modelingAgent.run(this.spec, this.context)
      );
      this.context.model = modelingResult.output;
      if (this.spec.guidanceEnabled) await this.waitForGuidance('modeling');

      // Stage 3: Design
      const designResult = await this.runWithRetry(
        'design',
        () => this.designAgent.run(this.spec, this.context)
      );
      this.context.design = designResult.output;
      if (this.spec.guidanceEnabled) await this.waitForGuidance('design');

      // Stage 4: Testing
      const testingResult = await this.runWithRetry(
        'testing',
        () => this.testingAgent.run(this.spec, this.context)
      );
      this.context.testing = testingResult.output;
      if (this.spec.guidanceEnabled) await this.waitForGuidance('testing');

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

  private async waitForGuidance(stageName: string): Promise<void> {
    console.log(`[Runner] Project ${this.projectId} pausing for guidance after ${stageName}`);
    
    // Poll for status change or feedback update
    let feedbackReceived = false;
    const POLLING_INTERVAL_MS = 5000; // 5 seconds
    const MAX_WAIT_MS = 3600000; // 1 hour timeout
    let elapsed = 0;

    // Update status to 'pending_guidance'
    await projectStore.update(this.projectId, { status: 'pending_guidance' });

    while (!feedbackReceived && elapsed < MAX_WAIT_MS) {
      const project = await projectStore.getById(this.projectId);
      if (!project) break;

      // Check if user submitted feedback for this stage or "approved" it
      const stage = project.stages.find(s => s.stage === stageName);
      // For this prototype, we'll assume a "resume" button on frontend sets a specific flag
      // or we just look for a new "guidance" entry in the spec if we want to re-run.
      // But for now, let's just check if the status is back to 'running' after being set to 'pending_guidance'
      // Or simpler: Check if the user has updated the Project Spec with new info.
      
      // MOCK RESUME: We will actually look for a dedicated 'resume' action in a new table
      // or just wait for the user to click a 'Resume' button that updates the status.
      if (project.status === 'running') {
          // If the UI set it to 'running', we continue
          feedbackReceived = true;
          break;
      }

      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
      elapsed += POLLING_INTERVAL_MS;
    }
  }
}
