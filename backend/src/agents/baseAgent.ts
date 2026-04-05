import OpenAI from 'openai';
import { ProjectSpec } from '../types/models';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AgentResult {
  output: any;
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

  protected async callOpenAI(userMessage: string, context?: any, retries = 3): Promise<string> {
    const finalSystemPrompt = context?.knowledgeBase 
      ? `${this.systemPrompt}\n\n### ADDITIONAL KNOWLEDGE BASE:\n${context.knowledgeBase}`
      : this.systemPrompt;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: finalSystemPrompt },
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

  protected parseJSON(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  abstract run(spec: ProjectSpec, context?: any): Promise<AgentResult>;
}
