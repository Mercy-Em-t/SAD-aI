import { DiagramOutput } from './projectStore';

interface ModelData {
  useCases?: Array<{ actor: string; actions: string[] }>;
  sequenceFlows?: Array<{ actor: string; steps: string[] }>;
  erRelationships?: Array<{ from: string; to: string; type: string }>;
  entities?: Array<{ name: string }>;
}

export class DiagramEngine {
  generateDiagrams(model: Record<string, unknown>): DiagramOutput[] {
    const modelData = model as ModelData;
    const diagrams: DiagramOutput[] = [];

    const useCaseDiagram = this.generateUseCaseDiagram(modelData);
    if (useCaseDiagram) diagrams.push(useCaseDiagram);

    const sequenceDiagram = this.generateSequenceDiagram(modelData);
    if (sequenceDiagram) diagrams.push(sequenceDiagram);

    const erDiagram = this.generateERDiagram(modelData);
    if (erDiagram) diagrams.push(erDiagram);

    return diagrams;
  }

  private generateUseCaseDiagram(model: ModelData): DiagramOutput | null {
    if (!model.useCases?.length) return null;

    const lines: string[] = ['graph TD'];
    model.useCases.forEach(uc => {
      const actorId = uc.actor.replace(/\s+/g, '_');
      uc.actions.forEach(action => {
        const actionId = action.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        lines.push(`  ${actorId}["${uc.actor}"] --> ${actionId}["${action}"]`);
      });
    });

    return {
      type: 'useCase',
      title: 'Use Case Diagram',
      mermaid: lines.join('\n'),
    };
  }

  private generateSequenceDiagram(model: ModelData): DiagramOutput | null {
    if (!model.sequenceFlows?.length) return null;

    const flow = model.sequenceFlows[0];
    const lines: string[] = ['sequenceDiagram'];
    const system = 'System';
    const db = 'Database';

    flow.steps.forEach(step => {
      lines.push(`  ${flow.actor}->>+${system}: ${step}`);
      lines.push(`  ${system}->>+${db}: Process ${step}`);
      lines.push(`  ${db}-->>-${system}: Result`);
      lines.push(`  ${system}-->>-${flow.actor}: Response`);
    });

    return {
      type: 'sequence',
      title: 'Sequence Diagram',
      mermaid: lines.join('\n'),
    };
  }

  private generateERDiagram(model: ModelData): DiagramOutput | null {
    if (!model.erRelationships?.length && !model.entities?.length) return null;

    const lines: string[] = ['erDiagram'];

    if (model.erRelationships?.length) {
      model.erRelationships.forEach(rel => {
        const from = rel.from.replace(/\s+/g, '_');
        const to = rel.to.replace(/\s+/g, '_');
        const mermaidType = this.getERType(rel.type);
        lines.push(`  ${from} ${mermaidType} ${to} : "relates to"`);
      });
    } else if (model.entities?.length && model.entities.length >= 2) {
      for (let i = 0; i < model.entities.length - 1; i++) {
        const from = model.entities[i].name.replace(/\s+/g, '_');
        const to = model.entities[i + 1].name.replace(/\s+/g, '_');
        lines.push(`  ${from} ||--o{ ${to} : "relates to"`);
      }
    }

    return {
      type: 'er',
      title: 'Entity Relationship Diagram',
      mermaid: lines.join('\n'),
    };
  }

  private getERType(type: string): string {
    const types: Record<string, string> = {
      'one-to-many': '||--o{',
      'many-to-many': '}o--o{',
      'one-to-one': '||--||',
      'many-to-one': '}o--||',
    };
    return types[type] || '||--o{';
  }
}

export const diagramEngine = new DiagramEngine();
