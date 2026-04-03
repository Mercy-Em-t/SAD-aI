import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AgentResult {
  output: Record<string, unknown>;
  score: {
    completeness: number;
    clarity: number;
    standardCompliance: number;
  };
}

export abstract class BaseAgent {
  protected name: string;
  protected systemPrompt: string;

  constructor(name: string, systemPrompt: string) {
    this.name = name;
    this.systemPrompt = systemPrompt;
  }

  protected async callOpenAI(userMessage: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: userMessage },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });
        return response.choices[0]?.message?.content || '{}';
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    return '{}';
  }

  protected parseJSON(text: string): Record<string, unknown> {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  abstract run(spec: Record<string, unknown>, context?: Record<string, unknown>): Promise<AgentResult>;
}
