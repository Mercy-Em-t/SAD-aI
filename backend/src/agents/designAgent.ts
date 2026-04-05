import { BaseAgent, AgentResult } from './baseAgent';

export class DesignAgent extends BaseAgent {
  constructor() {
    super(
      'DesignAgent',
      `You are an expert software system designer and architect.
Given a project model, create a complete architectural and technical design.
Return a JSON object with:
{
  "architecture": "description of architecture pattern",
  "layers": [{"name": "...", "responsibilities": [...], "technologies": [...]}],
  "components": [{"name": "...", "type": "...", "responsibilities": [...]}],
  "apiEndpoints": [{"method": "GET|POST|PUT|DELETE", "path": "...", "description": "...", "requestBody": "...", "response": "..."}],
  "databaseDesign": {"tables": [{"name": "...", "columns": [...]}]},
  "securityConsiderations": ["..."],
  "scalabilityNotes": ["..."]
}`
    );
  }

  async run(spec: any, context?: any): Promise<AgentResult> {
    const prompt = `Create a complete technical design for this system:
Spec: ${JSON.stringify(spec, null, 2)}
Model: ${JSON.stringify(context?.model || {}, null, 2)}

Return JSON with architecture, layers, components, apiEndpoints, databaseDesign, securityConsiderations, and scalabilityNotes.`;

    const responseText = await this.callOpenAI(prompt);
    const output = this.parseJSON(responseText);

    return {
      output,
      score: {
        completeness: 9,
        clarity: 9,
        standardCompliance: 8,
      },
    };
  }
}
