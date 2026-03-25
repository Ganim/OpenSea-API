import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { ToolRegistry } from '@/services/ai-tools/tool-registry';
import type { AiProviderMessage } from '@/services/ai-provider/ai-provider.interface';

interface CreateWorkflowRequest {
  tenantId: string;
  userId: string;
  naturalPrompt: string;
}

interface ParsedWorkflow {
  name: string;
  description: string;
  triggerType: 'MANUAL' | 'CRON' | 'EVENT';
  triggerConfig: Record<string, unknown> | null;
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }> | null;
  actions: Array<{
    toolName: string;
    arguments: Record<string, unknown>;
    order: number;
  }>;
}

const WORKFLOW_INTERPRETER_PROMPT = `Você é um interpretador de workflows para um sistema ERP chamado OpenSea.
O usuário descreverá um processo de negócio em linguagem natural e você deve convertê-lo em um workflow estruturado.

Responda EXCLUSIVAMENTE com JSON válido, sem nenhum texto adicional, markdown ou explicações.

O JSON deve seguir este formato:
{
  "name": "Nome curto do workflow (max 128 caracteres)",
  "description": "Descrição detalhada do que o workflow faz",
  "triggerType": "MANUAL" | "CRON" | "EVENT",
  "triggerConfig": {
    "cronExpression": "*/5 * * * *" (se CRON),
    "eventName": "nome.do.evento" (se EVENT)
  } ou null (se MANUAL),
  "conditions": [
    {
      "field": "campo a verificar",
      "operator": "eq|neq|gt|lt|gte|lte|contains",
      "value": "valor esperado"
    }
  ] ou null,
  "actions": [
    {
      "toolName": "nome_da_ferramenta",
      "arguments": { "arg1": "valor1" },
      "order": 1
    }
  ]
}

REGRAS:
1. O triggerType deve ser MANUAL se o usuário não especificar quando executar
2. Use CRON se o usuário mencionar intervalos (diário, semanal, a cada X minutos)
3. Use EVENT se o usuário mencionar "quando algo acontecer"
4. As actions devem usar APENAS ferramentas da lista de ferramentas disponíveis
5. Ordene as ações na sequência lógica de execução
6. Se o usuário pedir algo que não pode ser mapeado para ferramentas existentes, use as ferramentas mais próximas disponíveis

Ferramentas disponíveis:
`;

export class CreateWorkflowUseCase {
  constructor(
    private workflowsRepository: AiWorkflowsRepository,
    private aiRouter: AiRouter,
    private toolRegistry: ToolRegistry,
  ) {}

  async execute(request: CreateWorkflowRequest) {
    // Build tool list for the AI prompt
    const allTools = this.toolRegistry.getAllTools();
    const toolList = allTools
      .map((t) => `- ${t.name}: ${t.description} (módulo: ${t.module})`)
      .join('\n');

    const systemPrompt = WORKFLOW_INTERPRETER_PROMPT + toolList;

    const messages: AiProviderMessage[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Converta esta descrição em um workflow estruturado:\n\n"${request.naturalPrompt}"`,
      },
    ];

    // Use tier 3 (premium reasoning) for interpretation
    const response = await this.aiRouter.complete(messages, 3, {
      temperature: 0.1,
      maxTokens: 2000,
    });

    // Parse AI response
    let parsed: ParsedWorkflow;
    try {
      // Strip potential markdown code fences
      let content = response.content.trim();
      if (content.startsWith('```')) {
        content = content
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '');
      }
      parsed = JSON.parse(content);
    } catch {
      throw new Error(
        'Não foi possível interpretar a descrição do workflow. Tente descrever de forma mais clara.',
      );
    }

    // Validate parsed result
    if (!parsed.name || !parsed.actions || parsed.actions.length === 0) {
      throw new Error(
        'O workflow precisa ter pelo menos um nome e uma ação. Tente ser mais específico na descrição.',
      );
    }

    // Validate trigger type
    const validTriggers = ['MANUAL', 'CRON', 'EVENT'];
    if (!validTriggers.includes(parsed.triggerType)) {
      parsed.triggerType = 'MANUAL';
    }

    // Validate that referenced tools exist
    const validatedActions = parsed.actions
      .filter((action) => {
        const tool = this.toolRegistry.getTool(action.toolName);
        if (!tool) {
          console.warn(
            `[CreateWorkflow] Tool "${action.toolName}" not found, skipping action`,
          );
          return false;
        }
        return true;
      })
      .map((action, index) => ({
        toolName: action.toolName,
        arguments: action.arguments ?? {},
        order: action.order ?? index + 1,
      }));

    if (validatedActions.length === 0) {
      throw new Error(
        'Nenhuma das ações do workflow corresponde a ferramentas disponíveis. Tente uma descrição diferente.',
      );
    }

    // Create the workflow
    const workflow = await this.workflowsRepository.create({
      tenantId: request.tenantId,
      userId: request.userId,
      name: parsed.name.slice(0, 128),
      description: parsed.description ?? '',
      naturalPrompt: request.naturalPrompt,
      triggerType: parsed.triggerType,
      triggerConfig: parsed.triggerConfig ?? null,
      conditions: parsed.conditions ?? null,
      actions: validatedActions,
    });

    return {
      id: workflow.id.toString(),
      name: workflow.name,
      description: workflow.description,
      naturalPrompt: workflow.naturalPrompt,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig,
      conditions: workflow.conditions,
      actions: workflow.actions,
      isActive: workflow.isActive,
      createdAt: workflow.createdAt,
    };
  }
}
