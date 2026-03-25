import type {
  ModuleKnowledge,
  EntityKnowledge,
  WorkflowKnowledge,
  BusinessRule,
  DecisionTree,
  DataRequirement,
  CommonQuery,
  StatusFlow,
} from './module-knowledge.interface';
import type { KnowledgeRegistry } from './knowledge-registry';

/**
 * Configuration for how much knowledge to include in the prompt.
 */
interface PromptBuildOptions {
  /** Include entity descriptions and key fields */
  includeEntities?: boolean;
  /** Include status flow diagrams */
  includeStatusFlows?: boolean;
  /** Include workflow steps */
  includeWorkflows?: boolean;
  /** Include business rules */
  includeRules?: boolean;
  /** Include decision trees */
  includeDecisionTrees?: boolean;
  /** Include data requirements */
  includeDataRequirements?: boolean;
  /** Include common query strategies */
  includeCommonQueries?: boolean;
  /** Include cross-module dependencies */
  includeDependencies?: boolean;
  /** Maximum total characters (for token budget, 0 = unlimited) */
  maxChars?: number;
}

interface ResolvedPromptBuildOptions {
  includeEntities: boolean;
  includeStatusFlows: boolean;
  includeWorkflows: boolean;
  includeRules: boolean;
  includeDecisionTrees: boolean;
  includeDataRequirements: boolean;
  includeCommonQueries: boolean;
  includeDependencies: boolean;
  maxChars: number;
}

const DEFAULT_OPTIONS: ResolvedPromptBuildOptions = {
  includeEntities: true,
  includeStatusFlows: true,
  includeWorkflows: true,
  includeRules: true,
  includeDecisionTrees: true,
  includeDataRequirements: true,
  includeCommonQueries: true,
  includeDependencies: true,
  maxChars: 12000,
};

/**
 * Builds optimized system prompt text from module knowledge.
 * Designed to be token-efficient while providing the AI with
 * the information it needs to make intelligent decisions.
 */
export class KnowledgePromptBuilder {
  /**
   * Build a complete knowledge prompt for the given modules.
   * Selects relevant sections and formats them for AI consumption.
   */
  buildPrompt(
    modules: ModuleKnowledge[],
    options?: PromptBuildOptions,
  ): string {
    if (modules.length === 0) return '';

    const opts = { ...DEFAULT_OPTIONS, ...options };
    const sections: string[] = [];

    for (const mod of modules) {
      sections.push(this.buildModuleSection(mod, opts));
    }

    // Build behavior instructions (shared across all modules)
    sections.push(this.buildBehaviorInstructions());

    let result = sections.join('\n\n');

    // Truncate if exceeding budget
    if (opts.maxChars && result.length > opts.maxChars) {
      result =
        result.slice(0, opts.maxChars - 50) +
        '\n\n[Conhecimento truncado por limite de contexto]';
    }

    return result;
  }

  /**
   * Build a context-aware prompt that includes only the knowledge
   * relevant to the user's current message.
   */
  buildContextualPrompt(
    registry: KnowledgeRegistry,
    userMessage: string,
    userPermissions: string[],
  ): string {
    // 1. Get modules the user has access to
    const accessibleModules = registry.getRelevantModules(userPermissions);
    if (accessibleModules.length === 0) return '';

    // 2. Score modules by message relevance
    const intentModules = registry.getModulesByIntent(userMessage);

    // 3. Prioritize: intent-matched modules get full knowledge,
    //    others get minimal (entities + rules only)
    const primaryModules = intentModules.filter((m) =>
      accessibleModules.includes(m),
    );
    const secondaryModules = accessibleModules.filter(
      (m) => !primaryModules.includes(m),
    );

    const sections: string[] = [];

    // Primary modules: full knowledge
    const primaryKnowledge = registry.getModules(
      primaryModules.length > 0 ? primaryModules : accessibleModules,
    );
    for (const mod of primaryKnowledge) {
      sections.push(
        this.buildModuleSection(mod, {
          ...DEFAULT_OPTIONS,
          maxChars: 0,
        }),
      );
    }

    // Secondary modules: minimal knowledge (just entity list + rules)
    if (primaryModules.length > 0 && secondaryModules.length > 0) {
      const secondaryKnowledge = registry.getModules(secondaryModules);
      for (const mod of secondaryKnowledge) {
        sections.push(
          this.buildModuleSection(mod, {
            ...DEFAULT_OPTIONS,
            includeEntities: true,
            includeStatusFlows: false,
            includeWorkflows: false,
            includeRules: true,
            includeDecisionTrees: false,
            includeDataRequirements: false,
            includeCommonQueries: false,
            includeDependencies: false,
            maxChars: 0,
          }),
        );
      }
    }

    // Add matching query strategies for the user's message
    const matchingQueries = registry.findMatchingQueries(userMessage);
    if (matchingQueries.length > 0) {
      const top = matchingQueries.slice(0, 3);
      sections.push(this.buildQueryStrategySection(top));
    }

    // Add behavior instructions
    sections.push(this.buildBehaviorInstructions());

    return sections.join('\n\n');
  }

  // ================================================================
  // Private section builders
  // ================================================================

  private buildModuleSection(
    mod: ModuleKnowledge,
    opts: ResolvedPromptBuildOptions,
  ): string {
    const parts: string[] = [];

    parts.push(`## Modulo: ${mod.displayName} (${mod.module})`);
    parts.push(mod.description);

    if (opts.includeEntities) {
      parts.push(
        this.buildEntitiesSection(mod.entities, opts.includeStatusFlows),
      );
    }

    if (opts.includeWorkflows && mod.workflows.length > 0) {
      parts.push(this.buildWorkflowsSection(mod.workflows));
    }

    if (opts.includeRules && mod.rules.length > 0) {
      parts.push(this.buildRulesSection(mod.rules));
    }

    if (opts.includeDecisionTrees && mod.decisionTrees.length > 0) {
      parts.push(this.buildDecisionTreesSection(mod.decisionTrees));
    }

    if (opts.includeDataRequirements && mod.dataRequirements.length > 0) {
      parts.push(this.buildDataRequirementsSection(mod.dataRequirements));
    }

    if (opts.includeCommonQueries && mod.commonQueries.length > 0) {
      parts.push(this.buildCommonQueriesSection(mod.commonQueries));
    }

    if (opts.includeDependencies && mod.dependencies.length > 0) {
      const depLines = mod.dependencies.map(
        (d) => `- **${d.module}**: ${d.relationship}`,
      );
      parts.push(`### Dependencias\n${depLines.join('\n')}`);
    }

    return parts.join('\n\n');
  }

  private buildEntitiesSection(
    entities: EntityKnowledge[],
    includeStatusFlows: boolean,
  ): string {
    const lines: string[] = ['### Entidades'];

    for (const entity of entities) {
      lines.push(
        `**${entity.displayName}** (${entity.name}): ${entity.description}`,
      );

      // Key fields — compact table
      const requiredFields = entity.fields.filter((f) => f.required);
      const optionalFields = entity.fields.filter((f) => !f.required);

      if (requiredFields.length > 0) {
        const reqList = requiredFields
          .map((f) => `${f.displayName} (${f.name}: ${f.type})`)
          .join(', ');
        lines.push(`- Obrigatorios: ${reqList}`);
      }

      if (optionalFields.length > 0) {
        const optList = optionalFields
          .map((f) => `${f.displayName}`)
          .join(', ');
        lines.push(`- Opcionais: ${optList}`);
      }

      // Status flow — compact
      if (includeStatusFlows && entity.statusFlow) {
        lines.push(this.formatStatusFlow(entity.statusFlow));
      }

      // Validations — compact
      if (entity.validations.length > 0) {
        lines.push(`- Validacoes: ${entity.validations.join('; ')}`);
      }
    }

    return lines.join('\n');
  }

  private formatStatusFlow(flow: StatusFlow): string {
    const transitions: string[] = [];
    for (const [from, toList] of Object.entries(flow.transitions)) {
      transitions.push(`${from} -> ${toList.join(' | ')}`);
    }
    const terminal =
      flow.terminalStatuses.length > 0
        ? ` (terminal: ${flow.terminalStatuses.join(', ')})`
        : '';
    return `- Status: ${flow.initialStatus} (inicial)${terminal}. Transicoes: ${transitions.join('; ')}`;
  }

  private buildWorkflowsSection(workflows: WorkflowKnowledge[]): string {
    const lines: string[] = ['### Fluxos de Trabalho'];

    for (const wf of workflows) {
      lines.push(`**${wf.displayName}** (${wf.name}): ${wf.description}`);
      lines.push(`Gatilhos: ${wf.triggers.join(', ')}`);

      for (const step of wf.steps) {
        const actions = [
          ...step.autoActions.map((a) => `[auto] ${a}`),
          ...step.confirmActions.map((a) => `[confirmar] ${a}`),
        ];
        const actionsStr =
          actions.length > 0 ? ` | Ferramentas: ${actions.join(', ')}` : '';
        const dataStr =
          step.requiredData.length > 0
            ? ` | Dados: ${step.requiredData.join(', ')}`
            : '';

        lines.push(
          `${step.order}. ${step.name}: ${step.description}${dataStr}${actionsStr}`,
        );
      }

      lines.push(`Resultados: ${wf.outcomes.join(' | ')}`);
    }

    return lines.join('\n');
  }

  private buildRulesSection(rules: BusinessRule[]): string {
    const lines: string[] = ['### Regras de Negocio'];

    // Group by severity for readability
    const blocking = rules.filter((r) => r.severity === 'BLOCK');
    const warnings = rules.filter((r) => r.severity === 'WARN');
    const info = rules.filter((r) => r.severity === 'INFO');

    if (blocking.length > 0) {
      lines.push('**BLOQUEANTES:**');
      for (const r of blocking) {
        lines.push(
          `- [${r.id}] ${r.description}. Quando: ${r.condition} -> ${r.action}`,
        );
      }
    }

    if (warnings.length > 0) {
      lines.push('**ALERTAS:**');
      for (const r of warnings) {
        lines.push(
          `- [${r.id}] ${r.description}. Quando: ${r.condition} -> ${r.action}`,
        );
      }
    }

    if (info.length > 0) {
      lines.push('**INFO:**');
      for (const r of info) {
        lines.push(`- [${r.id}] ${r.description}. -> ${r.action}`);
      }
    }

    return lines.join('\n');
  }

  private buildDecisionTreesSection(trees: DecisionTree[]): string {
    const lines: string[] = ['### Arvores de Decisao'];

    for (const tree of trees) {
      lines.push(`**${tree.question}** (${tree.context})`);
      for (const branch of tree.branches) {
        const tool = branch.toolToUse ? ` [usar: ${branch.toolToUse}]` : '';
        lines.push(`- Se ${branch.condition} -> ${branch.action}${tool}`);

        if (branch.followUp) {
          for (const sub of branch.followUp.branches) {
            const subTool = sub.toolToUse ? ` [usar: ${sub.toolToUse}]` : '';
            lines.push(`  - Se ${sub.condition} -> ${sub.action}${subTool}`);
          }
        }
      }
    }

    return lines.join('\n');
  }

  private buildDataRequirementsSection(
    requirements: DataRequirement[],
  ): string {
    const lines: string[] = ['### Dados Necessarios por Acao'];

    for (const req of requirements) {
      lines.push(`**${req.action}:**`);

      const reqFields = req.required
        .map((f) => `${f.field} (${f.howToObtain})`)
        .join(', ');
      lines.push(`- Obrigatorios: ${reqFields}`);

      if (req.derivable.length > 0) {
        const derFields = req.derivable
          .map((f) => `${f.field}: ${f.derivationStrategy}`)
          .join('; ');
        lines.push(`- Derivaveis: ${derFields}`);
      }
    }

    return lines.join('\n');
  }

  private buildCommonQueriesSection(queries: CommonQuery[]): string {
    const lines: string[] = ['### Consultas Comuns'];

    for (const q of queries) {
      const tools = q.toolsNeeded.join(', ');
      lines.push(
        `- **${q.intent}**: "${q.examples[0]}" -> ${q.strategy} [${tools}]`,
      );
    }

    return lines.join('\n');
  }

  private buildQueryStrategySection(
    matches: Array<{
      module: string;
      query: CommonQuery;
      score: number;
    }>,
  ): string {
    const lines: string[] = ['### Estrategia Sugerida para esta Consulta'];

    for (const match of matches) {
      lines.push(
        `- [${match.module}] ${match.query.intent}: ${match.query.strategy} (ferramentas: ${match.query.toolsNeeded.join(', ')})`,
      );
    }

    return lines.join('\n');
  }

  private buildBehaviorInstructions(): string {
    return `### Comportamento do Assistente (CRITICO)

**Seja PROATIVO e EXECUTIVO.** Voce e um assistente de negocios eficiente, nao um formulario interativo.

1. **Quando o usuario pedir para criar algo, CRIE.** Nao fique pedindo detalhes opcionais. Use valores padrao razoaveis.
2. **Quando o usuario disser "preencha aleatoriamente" ou "pode inventar", INVENTE dados realistas** sem perguntar.
3. **Minimize perguntas.** So pergunte quando uma informacao e REALMENTE obrigatoria e nao pode ser inferida.
4. **Execute multiplas acoes em sequencia.** Se o usuario pedir algo complexo, execute toda a cadeia sem parar para perguntar entre cada etapa.
5. **Use o contexto existente.** Antes de perguntar, CONSULTE os dados que ja existem no sistema.
6. **Use as arvores de decisao** para determinar a acao correta quando o pedido for ambiguo.
7. **Valide dados usando as regras de negocio** antes de executar acoes.
8. **Siga os fluxos de trabalho** quando o usuario iniciar um processo multi-etapa.

**NUNCA faca isso:**
- Listar todos os campos opcionais e pedir preenchimento
- Recusar executar porque faltam dados opcionais
- Pedir confirmacao para acoes de leitura
- Repetir informacoes que ja foram ditas na conversa

### Protocolo de Confirmacao

Para acoes que modificam dados, apresente um RESUMO BREVE e peca confirmacao. Exemplo:
"Vou criar o produto 'Camiseta Basica' (template: Camiseta, status: ACTIVE). Confirma?"

### Formatacao

Formate respostas com markdown: tabelas para listas, negrito para numeros. Seja CONCISO.

### Tratamento de Erros

Se uma ferramenta retornar erro, explique brevemente e tente resolver automaticamente quando possivel.`;
  }
}
