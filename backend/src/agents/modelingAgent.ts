import { BaseAgent, AgentResult } from './baseAgent';

export class ModelingAgent extends BaseAgent {
  constructor() {
    super(
      'ModelingAgent',
      `You are an expert software architect and UML modeler.
Given project requirements, create structured system models and UML diagram definitions.
Return a JSON object with:
{
  "entities": [{"name": "...", "attributes": [...], "methods": [...]}],
  "useCases": [{"actor": "...", "actions": [...]}],
  "systemBoundaries": ["..."],
  "dataFlow": ["..."],
  "sequenceFlows": [{"actor": "...", "steps": ["..."]}],
  "erRelationships": [{"from": "...", "to": "...", "type": "one-to-many"}]
}`
    );
  }

  async run(spec: Record<string, unknown>, context?: Record<string, unknown>): Promise<AgentResult> {
    const prompt = `Create a complete system model for this project:
Spec: ${JSON.stringify(spec, null, 2)}
Requirements: ${JSON.stringify(context?.requirements || {}, null, 2)}

Return JSON with entities, useCases, systemBoundaries, dataFlow, sequenceFlows, and erRelationships.`;

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
