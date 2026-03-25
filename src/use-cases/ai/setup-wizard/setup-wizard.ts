import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { AiProviderMessage } from '@/services/ai-provider/ai-provider.interface';
import type { ToolExecutor } from '@/services/ai-tools/tool-executor';
import type { ToolRegistry } from '@/services/ai-tools/tool-registry';
import type {
  ToolCall,
  ToolExecutionContext,
} from '@/services/ai-tools/tool-types';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

// === Request / Response interfaces ===

export interface SetupWizardRequest {
  tenantId: string;
  userId: string;
  userPermissions: string[];
  businessDescription: string;
  industry?: string;
  employeeCount?: number;
  locationCount?: number;
}

export interface SetupPlanItem {
  order: number;
  module: string;
  action: string;
  description: string;
  args: Record<string, unknown>;
}

export interface SetupExecutionResult {
  planItemOrder: number;
  toolName: string;
  success: boolean;
  entityId?: string;
  entityName?: string;
  error?: string;
}

export interface SetupWizardResult {
  success: boolean;
  plan: SetupPlanItem[];
  executed: SetupExecutionResult[];
  summary: string;
}

// === Use Case ===

const SETUP_WIZARD_SYSTEM_PROMPT = `Você é um assistente de configuração inicial do sistema ERP OpenSea.
O usuário vai descrever o negócio dele em linguagem natural. Sua tarefa é gerar um plano de configuração
em formato JSON que será executado automaticamente.

FERRAMENTAS DISPONÍVEIS PARA CRIAÇÃO:

Estoque:
- stock_create_category: Cria categoria de produto (args: name, description?)
- stock_create_product: Cria produto (args: name, description?, sku?, categoryId?, status?)
- stock_create_supplier: Cria fornecedor (args: name, email?, phone?, document?)
- stock_create_manufacturer: Cria fabricante (args: name, website?)
- stock_create_template: Cria template de atributos (args: name, attributes[])
- stock_create_tag: Cria tag para produtos (args: name, color?)

RH:
- hr_create_department: Cria departamento (args: name, description?)
- hr_create_position: Cria cargo (args: name, departmentId?, description?)

Financeiro:
- finance_create_category: Cria categoria financeira (args: name, type: INCOME|EXPENSE, description?)
- finance_create_cost_center: Cria centro de custo (args: name, code?, description?)
- finance_create_bank_account: Cria conta bancária (args: name, bankName, type: CHECKING|SAVINGS|CASH, initialBalance?)

Vendas:
- sales_create_customer: Cria cliente (args: name, email?, phone?, type: INDIVIDUAL|BUSINESS, document?)

REGRAS:
1. Retorne APENAS um array JSON válido, sem markdown, sem explicação.
2. Cada item deve ter: order (número sequencial), module (stock|hr|finance|sales), action (nome da ferramenta), description (descrição curta em português), args (objeto com argumentos).
3. Crie primeiro as entidades que são dependência de outras (ex: departamentos antes de cargos, categorias antes de produtos).
4. Seja prático: crie apenas o que faz sentido para o tipo de negócio descrito.
5. Use nomes realistas e relevantes para o setor do negócio.
6. Quantidade sugerida: 3-5 categorias, 2-4 departamentos, 3-6 cargos, 2-3 centros de custo, 2-3 categorias financeiras.
7. NÃO crie produtos específicos — apenas categorias e estrutura organizacional.
8. Se o usuário mencionar número de funcionários ou locais, ajuste a estrutura proporcionalmente.

FORMATO DE RESPOSTA (exemplo):
[
  {"order":1,"module":"stock","action":"stock_create_category","description":"Categoria de eletrônicos","args":{"name":"Eletrônicos","description":"Produtos eletrônicos e acessórios"}},
  {"order":2,"module":"hr","action":"hr_create_department","description":"Departamento comercial","args":{"name":"Comercial","description":"Equipe de vendas e atendimento"}}
]`;

export class SetupWizardUseCase {
  constructor(
    private aiRouter: AiRouter,
    private toolRegistry: ToolRegistry,
    private toolExecutor: ToolExecutor,
  ) {}

  async execute(request: SetupWizardRequest): Promise<SetupWizardResult> {
    // Phase 1: Analyze — AI generates configuration plan
    const plan = await this.generatePlan(request);

    if (plan.length === 0) {
      return {
        success: false,
        plan: [],
        executed: [],
        summary:
          'Não foi possível gerar um plano de configuração a partir da descrição fornecida.',
      };
    }

    // Phase 2: Execute — run each plan item using tool executor
    const executed = await this.executePlan(plan, request);

    // Phase 3: Report — generate summary
    const summary = await this.generateSummary(plan, executed, request);

    const successCount = executed.filter((e) => e.success).length;

    return {
      success: successCount > 0,
      plan,
      executed,
      summary,
    };
  }

  // ─── Phase 1: Generate Plan ─────────────────────────────────

  private async generatePlan(
    request: SetupWizardRequest,
  ): Promise<SetupPlanItem[]> {
    const userPromptParts = [
      `Descrição do negócio: ${request.businessDescription}`,
    ];

    if (request.industry) {
      userPromptParts.push(`Setor: ${request.industry}`);
    }
    if (request.employeeCount) {
      userPromptParts.push(
        `Número aproximado de funcionários: ${request.employeeCount}`,
      );
    }
    if (request.locationCount) {
      userPromptParts.push(
        `Número de unidades/locais: ${request.locationCount}`,
      );
    }

    // Filter tools to only those the user has permission for
    const availableTools = this.toolRegistry.getToolsForUser(
      request.userPermissions,
    );
    const createToolNames = availableTools
      .filter((t) => t.name.includes('_create_'))
      .map((t) => t.name);

    if (createToolNames.length > 0) {
      userPromptParts.push(
        `\nFerramentas que o usuário tem permissão para usar: ${createToolNames.join(', ')}`,
      );
      userPromptParts.push(
        'Use APENAS as ferramentas listadas acima no plano.',
      );
    }

    const messages: AiProviderMessage[] = [
      { role: 'system', content: SETUP_WIZARD_SYSTEM_PROMPT },
      { role: 'user', content: userPromptParts.join('\n') },
    ];

    const response = await this.aiRouter.complete(messages, 3, {
      temperature: 0.3,
      maxTokens: 4000,
    });

    return this.parsePlanResponse(response.content);
  }

  private parsePlanResponse(content: string): SetupPlanItem[] {
    try {
      // Strip markdown code fences if present
      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned
          .replace(/^```(?:json)?\s*/, '')
          .replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        console.error('[SetupWizard] AI response is not an array');
        return [];
      }

      // Validate each item
      return parsed
        .filter(
          (item: Record<string, unknown>) =>
            typeof item.order === 'number' &&
            typeof item.module === 'string' &&
            typeof item.action === 'string' &&
            typeof item.description === 'string' &&
            typeof item.args === 'object' &&
            item.args !== null,
        )
        .map((item: Record<string, unknown>) => ({
          order: item.order as number,
          module: item.module as string,
          action: item.action as string,
          description: item.description as string,
          args: item.args as Record<string, unknown>,
        }))
        .sort((a: SetupPlanItem, b: SetupPlanItem) => a.order - b.order);
    } catch (error) {
      console.error(
        '[SetupWizard] Failed to parse AI plan response:',
        error instanceof Error ? error.message : error,
      );
      console.error('[SetupWizard] Raw content:', content.slice(0, 500));
      return [];
    }
  }

  // ─── Phase 2: Execute Plan ──────────────────────────────────

  private async executePlan(
    plan: SetupPlanItem[],
    request: SetupWizardRequest,
  ): Promise<SetupExecutionResult[]> {
    const results: SetupExecutionResult[] = [];
    // Track created entity IDs for dependency resolution
    const createdEntities: Map<string, string> = new Map();

    const context: ToolExecutionContext = {
      tenantId: request.tenantId,
      userId: request.userId,
      permissions: request.userPermissions,
      conversationId: 'setup-wizard', // Virtual conversation ID for logging
    };

    for (const item of plan) {
      try {
        // Resolve dependencies (e.g., departmentId for positions)
        const resolvedArgs = this.resolveDependencies(
          item.args,
          createdEntities,
        );

        const toolCall: ToolCall = {
          id: randomUUID(),
          name: item.action,
          arguments: resolvedArgs,
        };

        const toolResult = await this.toolExecutor.execute(toolCall, context);

        let success = !toolResult.isError;
        let entityId: string | undefined;
        let entityName: string | undefined;
        let error: string | undefined;

        try {
          const resultData = JSON.parse(toolResult.content);

          if (resultData.status === 'PENDING_CONFIRMATION') {
            // For the wizard, we bypass confirmation since this is a bulk setup.
            // Re-execute by calling the handler directly via a non-confirmation path.
            // The wizard is an automated process — confirmations are implicit.
            success = false;
            error = 'Ferramenta requer confirmação — ignorada no modo wizard.';
          } else if (resultData.error) {
            success = false;
            error = resultData.error;
          } else {
            entityId = resultData.id ?? resultData.entityId;
            entityName = resultData.name ?? resultData.entityName;

            // Track created entity for dependency resolution
            if (entityId) {
              const key = `${item.module}.${this.extractEntityType(item.action)}`;
              createdEntities.set(key, entityId);

              // Also track by name for position->department references
              if (entityName) {
                createdEntities.set(
                  `${key}.${entityName.toLowerCase()}`,
                  entityId,
                );
              }
            }
          }
        } catch {
          // If we can't parse the result, treat the raw content as success
          success = !toolResult.isError;
          if (toolResult.isError) {
            error = toolResult.content;
          }
        }

        // Log action to AiActionLog
        await this.logAction(request, item, success, entityId, error);

        results.push({
          planItemOrder: item.order,
          toolName: item.action,
          success,
          entityId,
          entityName,
          error,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';

        await this.logAction(request, item, false, undefined, errorMessage);

        results.push({
          planItemOrder: item.order,
          toolName: item.action,
          success: false,
          error: errorMessage,
        });
      }
    }

    return results;
  }

  private resolveDependencies(
    args: Record<string, unknown>,
    createdEntities: Map<string, string>,
  ): Record<string, unknown> {
    const resolved = { ...args };

    // If args reference a departmentId and we created a department, use that ID
    if ('departmentId' in resolved && resolved.departmentId === undefined) {
      const deptId = createdEntities.get('hr.department');
      if (deptId) {
        resolved.departmentId = deptId;
      }
    }

    // If args reference a categoryId and we created a category
    if ('categoryId' in resolved && resolved.categoryId === undefined) {
      const catId = createdEntities.get('stock.category');
      if (catId) {
        resolved.categoryId = catId;
      }
    }

    return resolved;
  }

  private extractEntityType(toolName: string): string {
    // stock_create_category -> category
    const parts = toolName.split('_');
    // Remove module prefix and 'create'
    return parts.slice(2).join('_');
  }

  private async logAction(
    request: SetupWizardRequest,
    item: SetupPlanItem,
    success: boolean,
    entityId?: string,
    error?: string,
  ): Promise<void> {
    try {
      await prisma.aiActionLog.create({
        data: {
          tenantId: request.tenantId,
          userId: request.userId,
          actionType: 'SETUP_WIZARD',
          targetModule: item.module,
          targetEntityType: this.extractEntityType(item.action),
          targetEntityId: entityId ?? null,
          input: JSON.parse(JSON.stringify(item.args)),
          output: success
            ? JSON.parse(JSON.stringify({ created: true }))
            : undefined,
          status: success ? 'EXECUTED' : 'FAILED',
          executedAt: new Date(),
          error: error ?? null,
        },
      });
    } catch (logError) {
      console.error(
        '[SetupWizard] Failed to log action:',
        logError instanceof Error ? logError.message : logError,
      );
    }
  }

  // ─── Phase 3: Generate Summary ─────────────────────────────

  private async generateSummary(
    plan: SetupPlanItem[],
    executed: SetupExecutionResult[],
    request: SetupWizardRequest,
  ): Promise<string> {
    const successCount = executed.filter((e) => e.success).length;
    const failCount = executed.filter((e) => !e.success).length;

    const successItems = executed
      .filter((e) => e.success)
      .map((e) => {
        const planItem = plan.find((p) => p.order === e.planItemOrder);
        return `- ${planItem?.description ?? e.toolName}${e.entityName ? ` ("${e.entityName}")` : ''}`;
      })
      .join('\n');

    const failItems = executed
      .filter((e) => !e.success)
      .map((e) => {
        const planItem = plan.find((p) => p.order === e.planItemOrder);
        return `- ${planItem?.description ?? e.toolName}: ${e.error ?? 'erro desconhecido'}`;
      })
      .join('\n');

    const parts: string[] = [];

    parts.push(
      `Configuração inicial concluída para: "${request.businessDescription}"`,
    );
    parts.push(
      `\nResultado: ${successCount} de ${plan.length} itens configurados com sucesso.`,
    );

    if (successItems) {
      parts.push(`\nItens criados:\n${successItems}`);
    }

    if (failCount > 0 && failItems) {
      parts.push(`\nItens com falha (${failCount}):\n${failItems}`);
    }

    return parts.join('\n');
  }
}
