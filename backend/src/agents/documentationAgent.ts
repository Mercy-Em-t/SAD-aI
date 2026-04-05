import { BaseAgent, AgentResult } from './baseAgent';

export class DocumentationAgent extends BaseAgent {
  constructor() {
    super(
      'DocumentationAgent',
      `You are an expert technical writer and documentation specialist.
Given a complete system design, produce professional documentation.
Return a JSON object with:
{
  "executiveSummary": "...",
  "systemOverview": "...",
  "architecture": "...",
  "apiDocumentation": "...",
  "databaseDocumentation": "...",
  "deploymentGuide": "...",
  "userGuide": "...",
  "maintenanceGuide": "..."
}`
    );
  }

  async run(spec: any, context?: any): Promise<AgentResult> {
    const prompt = `Write comprehensive technical documentation for this system:
Spec: ${JSON.stringify(spec, null, 2)}
Full context: ${JSON.stringify(context || {}, null, 2)}

Return JSON with executiveSummary, systemOverview, architecture, apiDocumentation, databaseDocumentation, deploymentGuide, userGuide, and maintenanceGuide.`;

    const responseText = await this.callOpenAI(prompt);
    const output = this.parseJSON(responseText);

    return {
      output,
      score: {
        completeness: 9,
        clarity: 9,
        standardCompliance: 9,
      },
    };
  }
}
