import { BaseAgent, AgentResult } from './baseAgent';

export class RequirementsAgent extends BaseAgent {
  constructor() {
    super(
      'RequirementsAgent',
      `You are an expert software requirements analyst. 
Given a project specification, extract and structure all functional and non-functional requirements.
Return a JSON object with:
{
  "functional": ["requirement 1", ...],
  "nonFunctional": ["performance requirement 1", ...],
  "userStories": ["As a user, I want to...", ...],
  "constraints": ["constraint 1", ...],
  "assumptions": ["assumption 1", ...]
}`
    );
  }

  async run(spec: Record<string, unknown>): Promise<AgentResult> {
    const prompt = `Analyze this project specification and extract all requirements:
${JSON.stringify(spec, null, 2)}

Return a comprehensive JSON with functional, nonFunctional, userStories, constraints, and assumptions.`;

    const responseText = await this.callOpenAI(prompt);
    const output = this.parseJSON(responseText);

    return {
      output,
      score: {
        completeness: this.scoreCompleteness(output),
        clarity: 8,
        standardCompliance: 9,
      },
    };
  }

  private scoreCompleteness(output: Record<string, unknown>): number {
    let score = 5;
    if (Array.isArray(output.functional) && output.functional.length > 0) score += 1;
    if (Array.isArray(output.nonFunctional) && output.nonFunctional.length > 0) score += 1;
    if (Array.isArray(output.userStories) && output.userStories.length > 0) score += 1;
    if (Array.isArray(output.constraints) && output.constraints.length > 0) score += 1;
    if (Array.isArray(output.assumptions) && output.assumptions.length > 0) score += 1;
    return Math.min(score, 10);
  }
}
