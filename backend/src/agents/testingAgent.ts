import { BaseAgent, AgentResult } from './baseAgent';

export class TestingAgent extends BaseAgent {
  constructor() {
    super(
      'TestingAgent',
      `You are an expert QA engineer and testing specialist.
Given a system design, create a comprehensive test plan with test cases.
Return a JSON object with:
{
  "unitTests": [{"component": "...", "testCases": ["..."]}],
  "integrationTests": ["..."],
  "e2eTests": ["..."],
  "performanceTests": ["..."],
  "securityTests": ["..."],
  "testingStrategy": "...",
  "coverageTargets": {"unit": 80, "integration": 70, "e2e": 60}
}`
    );
  }

  async run(spec: Record<string, unknown>, context?: Record<string, unknown>): Promise<AgentResult> {
    const prompt = `Create a comprehensive test plan for this system:
Spec: ${JSON.stringify(spec, null, 2)}
Design: ${JSON.stringify(context?.design || {}, null, 2)}

Return JSON with unitTests, integrationTests, e2eTests, performanceTests, securityTests, testingStrategy, and coverageTargets.`;

    const responseText = await this.callOpenAI(prompt);
    const output = this.parseJSON(responseText);

    return {
      output,
      score: {
        completeness: 9,
        clarity: 8,
        standardCompliance: 9,
      },
    };
  }
}
