import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import type { AiMessagesRepository } from '@/repositories/ai/ai-messages-repository';
import type { AiTenantConfigRepository } from '@/repositories/ai/ai-tenant-config-repository';
import type { AiActionLogsRepository } from '@/repositories/ai/ai-action-logs-repository';
import type { AiRouter } from '@/services/ai-provider/ai-router';
import type {
  AiProviderMessage,
  AiTier,
} from '@/services/ai-provider/ai-provider.interface';
import type { ToolRegistry } from '@/services/ai-tools/tool-registry';
import type { ToolExecutor } from '@/services/ai-tools/tool-executor';
import type {
  AiAgenticMessage,
  ToolCall,
} from '@/services/ai-tools/tool-types';
import { AGENTIC_LOOP_MAX_ITERATIONS } from '@/services/ai-tools/tool-types';
import type { KnowledgeRegistry } from '@/services/ai-tools/knowledge/knowledge-registry';
import { KnowledgePromptBuilder } from '@/services/ai-tools/knowledge/knowledge-prompt-builder';
import type { DocsRegistry } from '@/services/ai-tools/knowledge/docs-registry';
import { BusinessSnapshotService } from '@/services/ai-tools/business-snapshot.service';
import {
  buildPendingAction,
  getToolDisplayName,
  type ActionCardRenderData,
  type PendingActionData,
} from '@/services/ai-tools/pending-action.service';
import { makeUndoActionUseCase } from '@/use-cases/ai/actions/factories/make-undo-action-use-case';
import { prisma } from '@/lib/prisma';

interface SendMessageRequest {
  tenantId: string;
  userId: string;
  conversationId?: string;
  content: string;
  context?: string;
  contextModule?: string;
  contextEntityType?: string;
  contextEntityId?: string;
  attachments?: Record<string, unknown> | null;
  tier?: AiTier;
  userPermissions?: string[];
}

const PERSONALITY_PROMPTS: Record<string, string> = {
  PROFESSIONAL:
    'Você é um assistente empresarial profissional, objetivo e eficiente.',
  FRIENDLY:
    'Você é um assistente empresarial simpático e acessível, mantendo profissionalismo.',
  TECHNICAL: 'Você é um assistente empresarial técnico, preciso e detalhista.',
  CASUAL:
    'Você é um assistente empresarial descontraído, mas sempre útil e informativo.',
};

/** Regex to detect user confirm/cancel/undo commands for pending actions */
const CONFIRM_ACTION_REGEX =
  /^(?:confirmar|confirm)\s+(?:a[çc][ãa]o|action)[:\s]+([a-f0-9-]{36})/i;
const CANCEL_ACTION_REGEX =
  /^(?:cancelar|cancel)\s+(?:a[çc][ãa]o|action)[:\s]+([a-f0-9-]{36})/i;
const UNDO_ACTION_REGEX =
  /^(?:desfazer|undo)\s+(?:a[çc][ãa]o|action)[:\s]+([a-f0-9-]{36})/i;
const UNDO_LAST_ACTION_REGEX =
  /^(?:desfazer|undo)(?:\s+(?:[uú]ltima\s+)?(?:a[çc][ãa]o|action))?$/i;

export class SendMessageUseCase {
  private knowledgePromptBuilder = new KnowledgePromptBuilder();

  constructor(
    private conversationsRepository: AiConversationsRepository,
    private messagesRepository: AiMessagesRepository,
    private configRepository: AiTenantConfigRepository,
    private aiRouter: AiRouter,
    private toolRegistry: ToolRegistry,
    private toolExecutor: ToolExecutor,
    private knowledgeRegistry: KnowledgeRegistry,
    private actionLogsRepository: AiActionLogsRepository,
    private docsRegistry?: DocsRegistry,
  ) {}

  private snapshotService = new BusinessSnapshotService();

  async execute(request: SendMessageRequest) {
    let conversationId = request.conversationId;

    // Create a new conversation if none provided
    if (!conversationId) {
      const conversation = await this.conversationsRepository.create({
        tenantId: request.tenantId,
        userId: request.userId,
        title: request.content.slice(0, 100),
        context: request.context ?? 'DEDICATED',
        contextModule: request.contextModule,
        contextEntityType: request.contextEntityType,
        contextEntityId: request.contextEntityId,
      });
      conversationId = conversation.id.toString();
    } else {
      // Verify conversation exists and belongs to user
      const conversation = await this.conversationsRepository.findById(
        conversationId,
        request.tenantId,
      );

      if (!conversation || conversation.userId.toString() !== request.userId) {
        throw new Error('Conversation not found');
      }
    }

    // Save user message
    const userMessage = await this.messagesRepository.create({
      conversationId,
      role: 'USER',
      content: request.content,
      contentType: 'TEXT',
      attachments: request.attachments,
    });

    // ── Check if user is confirming, cancelling, or undoing an action ──
    const confirmMatch = request.content.match(CONFIRM_ACTION_REGEX);
    const cancelMatch = request.content.match(CANCEL_ACTION_REGEX);
    const undoMatch = request.content.match(UNDO_ACTION_REGEX);
    const undoLastMatch = request.content.match(UNDO_LAST_ACTION_REGEX);

    if (confirmMatch) {
      return this.handleConfirmAction(
        confirmMatch[1],
        conversationId,
        request,
        userMessage,
      );
    }

    if (cancelMatch) {
      return this.handleCancelAction(
        cancelMatch[1],
        conversationId,
        request,
        userMessage,
      );
    }

    if (undoMatch) {
      return this.handleUndoAction(
        undoMatch[1],
        conversationId,
        request,
        userMessage,
      );
    }

    if (undoLastMatch) {
      return this.handleUndoLastAction(conversationId, request, userMessage);
    }

    // ── Normal AI flow ────────────────────────────────────────────────
    // Load tenant AI configuration for personality and tier settings
    const config = await this.configRepository.findByTenantId(request.tenantId);

    const assistantName = config?.assistantName ?? 'Atlas';
    const personality = config?.personality ?? 'PROFESSIONAL';
    const language = config?.language ?? 'pt-BR';

    // Build system prompt
    const personalityPrompt =
      personality === 'CUSTOM' && config?.customPersonality
        ? config.customPersonality
        : (PERSONALITY_PROMPTS[personality] ??
          PERSONALITY_PROMPTS.PROFESSIONAL);

    const systemPromptParts = [
      `Seu nome é ${assistantName}. ${personalityPrompt}`,
      `Responda sempre em ${language}.`,
      '',
      'Você é o assistente inteligente do OpenSea ERP. Você pode responder QUALQUER pergunta sobre o sistema e o negócio do usuário.',
      '',
      'CAPACIDADES:',
      '- Responder perguntas sobre qualquer módulo do sistema (Estoque, Financeiro, RH, Vendas, Ferramentas)',
      '- Ensinar o usuário a usar funcionalidades com passo a passo detalhado',
      '- Diagnosticar problemas, erros e limitações do sistema',
      '- Consultar dados reais do negócio usando ferramentas de busca e KPIs',
      '- Executar ações (criar, modificar, deletar) quando solicitado',
      '- Cruzar informações entre módulos para análises complexas',
      '',
      'REGRAS DE PERMISSAO (CRITICO — NUNCA VIOLE):',
      '- Você SÓ pode consultar e mostrar dados de módulos que o usuário tem permissão',
      '- Se uma pergunta exige dados de um módulo sem permissão, informe EXATAMENTE quais permissões faltam',
      '- NUNCA invente dados — se não tem a informação, use as ferramentas para buscar',
      '- NUNCA assuma que o usuário tem acesso a algo — as ferramentas validam automaticamente',
      '- Se a ferramenta retornar "missingPermissions", repasse ao usuário de forma clara',
      '',
      'QUANDO O USUARIO PERGUNTA "COMO FAZER X":',
      '- Use a documentação interna fornecida abaixo para dar um passo a passo PRECISO e ATUALIZADO',
      '- Inclua o caminho de navegação no sistema (ex: Menu > Estoque > Produtos > Novo)',
      '- Se houver pré-requisitos, mencione-os ANTES dos passos',
      '- Se houver erros comuns, mencione-os ao final',
      '',
      'QUANDO O USUARIO RELATA UM PROBLEMA:',
      '- Consulte a seção de troubleshooting da documentação',
      '- Verifique se o problema é de: permissão, configuração, dados incorretos, ou limitação do sistema',
      '- Sugira solução passo a passo, da causa mais provável para a menos provável',
      '- Se for limitação conhecida, informe claramente',
      '',
      'QUANDO O USUARIO PEDE DADOS OU ANALISES:',
      '- Use atlas_get_business_kpis para métricas gerais',
      '- Use atlas_search_entities para buscar entidades específicas',
      '- Use atlas_cross_module_query para cruzamentos entre módulos',
      '- Use atlas_refresh_snapshot se o usuário pedir dados atualizados',
      '- Apresente resultados com formatação markdown (tabelas, negrito para números)',
      '',
      'Quando uma ferramenta requer confirmação, NÃO chame confirm_pending_action automaticamente. Apenas apresente os dados ao usuário e aguarde a resposta dele.',
    ];

    // Fetch relevant operational docs
    const relevantDocs = this.docsRegistry
      ? this.docsRegistry.findRelevantDocs(
          request.content,
          request.userPermissions ?? [],
        )
      : [];

    // Fetch business snapshot (cached, fast)
    let filteredSnapshot = undefined;
    try {
      const snapshot = await this.snapshotService.getOrGenerate(
        request.tenantId,
      );
      filteredSnapshot = this.snapshotService.filterByPermissions(
        snapshot,
        request.userPermissions ?? [],
      );
    } catch {
      // Non-critical: snapshot failure should not block conversation
    }

    // Build contextual knowledge prompt from module knowledge system
    const knowledgePrompt = this.knowledgePromptBuilder.buildContextualPrompt(
      this.knowledgeRegistry,
      request.content,
      request.userPermissions ?? [],
      {
        docs: relevantDocs,
        snapshot: filteredSnapshot,
      },
    );

    if (knowledgePrompt) {
      systemPromptParts.push(knowledgePrompt);
    }

    const systemPrompt = systemPromptParts.join('\n');

    // Build message history for context
    const recentMessages = await this.messagesRepository.findMany({
      conversationId,
      page: 1,
      limit: 20,
    });

    const aiMessages: AiProviderMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (oldest first)
    const historyMessages = recentMessages.messages
      .filter((m) => m.id.toString() !== userMessage.id.toString())
      .reverse();

    for (const msg of historyMessages) {
      // Skip messages without content (unless they have tool data)
      if (!msg.content && !msg.toolCalls) continue;

      if (msg.role === 'USER') {
        aiMessages.push({ role: 'user', content: msg.content ?? '' });
      } else if (msg.role === 'ASSISTANT') {
        // Include tool call results in the assistant message content
        // so the AI has context of what it did previously
        let content = msg.content ?? '';
        if (msg.toolCalls) {
          try {
            const calls =
              typeof msg.toolCalls === 'string'
                ? JSON.parse(msg.toolCalls)
                : msg.toolCalls;
            if (Array.isArray(calls) && calls.length > 0) {
              const toolSummary = calls
                .map(
                  (tc: { name: string; arguments?: Record<string, unknown> }) =>
                    `[Ferramenta chamada: ${tc.name}(${JSON.stringify(tc.arguments ?? {}).slice(0, 200)})]`,
                )
                .join('\n');
              content = content ? `${content}\n\n${toolSummary}` : toolSummary;
            }
          } catch {
            // Ignore JSON parse errors on toolCalls
          }
        }
        if (content) {
          aiMessages.push({ role: 'assistant', content });
        }
      }
    }

    // Add current user message
    aiMessages.push({ role: 'user', content: request.content });

    // Determine tier
    const tier = request.tier ?? 1;

    // Call AI provider
    let aiContent: string;
    let aiModel = 'unavailable';
    let aiTokensInput = 0;
    let aiTokensOutput = 0;
    let aiLatencyMs = 0;
    let aiCost = 0;
    let usedTier: AiTier = tier;
    const allToolCalls: ToolCall[] = [];
    let pendingAction: PendingActionData | null = null;

    const availableTiers = this.aiRouter.getAvailableTiers();

    if (availableTiers.length === 0) {
      // No providers configured — return helpful fallback
      aiContent = `Olá! Sou o ${assistantName}. No momento, nenhum provedor de IA está configurado. Por favor, configure as chaves de API (GROQ_API_KEY ou ANTHROPIC_API_KEY) nas variáveis de ambiente para habilitar respostas inteligentes.`;
      aiModel = 'fallback';
    } else {
      try {
        // Check if user has permissions and tools are available
        const filteredTools = this.toolRegistry.getToolsForUser(
          request.userPermissions ?? [],
        );

        if (filteredTools.length > 0) {
          // Agentic loop with tool calling
          const loopMessages: AiAgenticMessage[] = [...aiMessages];
          let finalContent: string | null = null;
          let totalTokensIn = 0;
          let totalTokensOut = 0;
          let totalLatency = 0;
          let totalCost = 0;

          for (let i = 0; i < AGENTIC_LOOP_MAX_ITERATIONS; i++) {
            const response = await this.aiRouter.completeWithTools(
              loopMessages,
              filteredTools,
              tier,
            );

            totalTokensIn += response.tokensInput;
            totalTokensOut += response.tokensOutput;
            totalLatency += response.latencyMs;
            totalCost += response.estimatedCost;
            aiModel = response.model;
            usedTier = response.tier;

            if (response.toolCalls && response.toolCalls.length > 0) {
              allToolCalls.push(...response.toolCalls);

              // Push ONE assistant message with ALL tool calls
              loopMessages.push({
                role: 'assistant',
                content: response.content,
                toolCalls: response.toolCalls,
              });

              // Execute each tool call and push results
              let hasPendingConfirmation = false;

              for (const tc of response.toolCalls) {
                const result = await this.toolExecutor.execute(tc, {
                  tenantId: request.tenantId,
                  userId: request.userId,
                  permissions: request.userPermissions ?? [],
                  conversationId,
                });

                loopMessages.push({
                  role: 'tool',
                  toolCallId: tc.id,
                  content: result.content,
                });

                // If this tool requires confirmation, build the ACTION_CARD
                if (result.pendingConfirmation) {
                  hasPendingConfirmation = true;
                  const tool = this.toolRegistry.getTool(tc.name);
                  if (tool) {
                    pendingAction = buildPendingAction(tc, tool);
                  }
                }
              }

              // If we hit a pending confirmation, break the loop and let AI
              // generate the confirmation message in the next iteration
              if (hasPendingConfirmation) {
                // Do one more AI call so it generates the user-facing text
                const confirmResponse = await this.aiRouter.completeWithTools(
                  loopMessages,
                  filteredTools,
                  tier,
                );

                totalTokensIn += confirmResponse.tokensInput;
                totalTokensOut += confirmResponse.tokensOutput;
                totalLatency += confirmResponse.latencyMs;
                totalCost += confirmResponse.estimatedCost;

                finalContent =
                  confirmResponse.content ??
                  'Essa ação requer sua confirmação. Deseja prosseguir?';
                break;
              }
            } else {
              finalContent = response.content;
              break;
            }
          }

          aiContent =
            finalContent ??
            'Desculpe, não consegui completar a análise. Tente reformular sua pergunta.';
          aiTokensInput = totalTokensIn;
          aiTokensOutput = totalTokensOut;
          aiLatencyMs = totalLatency;
          aiCost = totalCost;
        } else {
          // Simple completion without tools (existing behavior)
          const response = await this.aiRouter.complete(aiMessages, tier);
          aiContent = response.content;
          aiModel = response.model;
          aiTokensInput = response.tokensInput;
          aiTokensOutput = response.tokensOutput;
          aiLatencyMs = response.latencyMs;
          aiCost = response.estimatedCost;
          usedTier = response.tier;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AI Provider Error] Tier ${tier}: ${errorMessage}`);
        if (error instanceof Error && error.stack) {
          console.error(`[AI Provider Stack]`, error.stack);
        }

        aiContent = `Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes.`;
        aiModel = 'error';
        aiLatencyMs = 0;
      }
    }

    // ── Determine content type and renderData ─────────────────────────
    let contentType = 'TEXT';
    let renderData: Record<string, unknown> | null = null;

    if (pendingAction) {
      contentType = 'ACTION_CARD';
      renderData = pendingAction.renderData as unknown as Record<
        string,
        unknown
      >;

      // Persist the pending action in AiActionLog
      const actionLog = await this.actionLogsRepository.create({
        tenantId: request.tenantId,
        userId: request.userId,
        conversationId,
        actionType: pendingAction.toolName,
        targetModule: pendingAction.module,
        targetEntityType: pendingAction.entityType,
        input: pendingAction.args,
        status: 'PROPOSED',
      });

      // Update renderData with the actual persisted actionId
      (renderData as Record<string, unknown>).actionId = actionLog.id;
      (pendingAction.renderData as ActionCardRenderData).actionId =
        actionLog.id;
    }

    const assistantMessage = await this.messagesRepository.create({
      conversationId,
      role: 'ASSISTANT',
      content: aiContent,
      contentType,
      renderData,
      aiTier: usedTier,
      aiModel,
      aiTokensInput,
      aiTokensOutput,
      aiLatencyMs,
      aiCost,
      toolCalls:
        allToolCalls.length > 0
          ? (allToolCalls as unknown as Record<string, unknown>)
          : null,
    });

    // If we created an action log, link the messageId back
    if (pendingAction && renderData) {
      const actionId = (renderData as Record<string, unknown>).actionId;
      if (typeof actionId === 'string') {
        await this.actionLogsRepository.updateStatus(actionId, 'PROPOSED', {
          // We store messageId via a separate update since we need the message ID
        });
      }
    }

    // Update conversation message count
    const conversation = await this.conversationsRepository.findById(
      conversationId,
      request.tenantId,
    );

    if (conversation) {
      await this.conversationsRepository.updateMessageCount(
        conversationId,
        conversation.messageCount + 2,
        new Date(),
      );
    }

    return {
      conversationId,
      userMessage: {
        id: userMessage.id.toString(),
        role: userMessage.role,
        content: userMessage.content,
        contentType: userMessage.contentType,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id.toString(),
        role: assistantMessage.role,
        content: assistantMessage.content,
        contentType: assistantMessage.contentType,
        renderData: assistantMessage.renderData,
        aiModel: assistantMessage.aiModel,
        aiTier: assistantMessage.aiTier,
        aiTokensInput: assistantMessage.aiTokensInput,
        aiTokensOutput: assistantMessage.aiTokensOutput,
        aiLatencyMs: assistantMessage.aiLatencyMs,
        aiCost: assistantMessage.aiCost,
        createdAt: assistantMessage.createdAt,
      },
    };
  }

  // ── Confirm a pending action ──────────────────────────────────────────

  private async handleConfirmAction(
    actionId: string,
    conversationId: string,
    request: SendMessageRequest,
    userMessage: {
      id: { toString(): string };
      role: string;
      content: string | null;
      contentType: string;
      createdAt: Date;
    },
  ) {
    const actionLog = await this.actionLogsRepository.findById(actionId);

    if (!actionLog) {
      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        'Ação não encontrada. Verifique o ID informado.',
        'TEXT',
        null,
      );
    }

    if (actionLog.status !== 'PROPOSED') {
      const statusMessage =
        actionLog.status === 'EXECUTED'
          ? 'Esta ação já foi executada anteriormente.'
          : actionLog.status === 'CANCELLED'
            ? 'Esta ação foi cancelada.'
            : `Esta ação está com status "${actionLog.status}" e não pode ser confirmada.`;

      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        statusMessage,
        'TEXT',
        null,
      );
    }

    // Execute the tool directly (bypass confirmation check)
    const execution = await this.toolExecutor.executeDirect(
      actionLog.actionType,
      actionLog.input,
      {
        tenantId: request.tenantId,
        userId: request.userId,
        permissions: request.userPermissions ?? [],
        conversationId,
      },
    );

    if (!execution.success) {
      await this.actionLogsRepository.updateStatus(actionId, 'FAILED', {
        confirmedByUserId: request.userId,
        confirmedAt: new Date(),
        error: execution.error,
      });

      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        `Erro ao executar a ação: ${execution.error}`,
        'TEXT',
        null,
      );
    }

    // Extract entity ID from execution result for audit linking
    const execResult = execution.result as Record<string, unknown> | undefined;
    const entityId = this.extractEntityId(execResult, actionLog);

    // Mark as executed
    const updateExtra: {
      confirmedByUserId: string;
      confirmedAt: Date;
      executedAt: Date;
      output: Record<string, unknown>;
      auditLogId?: string;
    } = {
      confirmedByUserId: request.userId,
      confirmedAt: new Date(),
      executedAt: new Date(),
      output: execution.result as Record<string, unknown>,
    };

    // Update target entity ID if it was extracted from the result
    if (entityId && !actionLog.targetEntityId) {
      // Store entity ID in output so we can reference it later
      updateExtra.output = {
        ...updateExtra.output,
        _entityId: entityId,
      };
    }

    // Link to the most recent AuditLog for this entity
    if (entityId) {
      try {
        const auditLog = await prisma.auditLog.findFirst({
          where: {
            entityId,
            tenantId: request.tenantId,
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        });

        if (auditLog) {
          updateExtra.auditLogId = auditLog.id;
        }
      } catch {
        // Non-critical: audit link failure should not break execution
      }
    }

    await this.actionLogsRepository.updateStatus(
      actionId,
      'EXECUTED',
      updateExtra,
    );

    // Also update targetEntityId if we now have it
    if (entityId && !actionLog.targetEntityId) {
      try {
        await prisma.aiActionLog.update({
          where: { id: actionId },
          data: { targetEntityId: entityId },
        });
      } catch {
        // Non-critical
      }
    }

    const displayName = getToolDisplayName(actionLog.actionType);
    const renderData: ActionCardRenderData = {
      type: 'ACTION_CARD',
      actionId,
      toolName: actionLog.actionType,
      displayName,
      module: actionLog.targetModule,
      status: 'EXECUTED',
      fields: [],
    };

    return this.buildActionResponse(
      conversationId,
      request,
      userMessage,
      `A ação "${displayName}" foi executada com sucesso.`,
      'ACTION_CARD',
      renderData as unknown as Record<string, unknown>,
    );
  }

  // ── Cancel a pending action ───────────────────────────────────────────

  private async handleCancelAction(
    actionId: string,
    conversationId: string,
    request: SendMessageRequest,
    userMessage: {
      id: { toString(): string };
      role: string;
      content: string | null;
      contentType: string;
      createdAt: Date;
    },
  ) {
    const actionLog = await this.actionLogsRepository.findById(actionId);

    if (!actionLog) {
      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        'Ação não encontrada. Verifique o ID informado.',
        'TEXT',
        null,
      );
    }

    if (actionLog.status !== 'PROPOSED') {
      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        `Esta ação não pode ser cancelada (status: ${actionLog.status}).`,
        'TEXT',
        null,
      );
    }

    await this.actionLogsRepository.updateStatus(actionId, 'CANCELLED');

    const displayName = getToolDisplayName(actionLog.actionType);
    const renderData: ActionCardRenderData = {
      type: 'ACTION_CARD',
      actionId,
      toolName: actionLog.actionType,
      displayName,
      module: actionLog.targetModule,
      status: 'CANCELLED',
      fields: [],
    };

    return this.buildActionResponse(
      conversationId,
      request,
      userMessage,
      `A ação "${displayName}" foi cancelada.`,
      'ACTION_CARD',
      renderData as unknown as Record<string, unknown>,
    );
  }

  // ── Helper to build a response without going through the AI ───────────

  private async buildActionResponse(
    conversationId: string,
    request: SendMessageRequest,
    userMessage: {
      id: { toString(): string };
      role: string;
      content: string | null;
      contentType: string;
      createdAt: Date;
    },
    content: string,
    contentType: string,
    renderData: Record<string, unknown> | null,
  ) {
    const assistantMessage = await this.messagesRepository.create({
      conversationId,
      role: 'ASSISTANT',
      content,
      contentType,
      renderData,
    });

    // Update conversation message count
    const conversation = await this.conversationsRepository.findById(
      conversationId,
      request.tenantId,
    );

    if (conversation) {
      await this.conversationsRepository.updateMessageCount(
        conversationId,
        conversation.messageCount + 2,
        new Date(),
      );
    }

    return {
      conversationId,
      userMessage: {
        id: userMessage.id.toString(),
        role: userMessage.role,
        content: userMessage.content,
        contentType: userMessage.contentType,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id.toString(),
        role: assistantMessage.role,
        content: assistantMessage.content,
        contentType: assistantMessage.contentType,
        renderData: assistantMessage.renderData,
        aiModel: assistantMessage.aiModel,
        aiTier: assistantMessage.aiTier,
        aiTokensInput: assistantMessage.aiTokensInput,
        aiTokensOutput: assistantMessage.aiTokensOutput,
        aiLatencyMs: assistantMessage.aiLatencyMs,
        aiCost: assistantMessage.aiCost,
        createdAt: assistantMessage.createdAt,
      },
    };
  }

  // ── Undo a specific action by ID ────────────────────────────────────

  private async handleUndoAction(
    actionId: string,
    conversationId: string,
    request: SendMessageRequest,
    userMessage: {
      id: { toString(): string };
      role: string;
      content: string | null;
      contentType: string;
      createdAt: Date;
    },
  ) {
    try {
      const undoUseCase = makeUndoActionUseCase();
      const result = await undoUseCase.execute({
        actionLogId: actionId,
        tenantId: request.tenantId,
        userId: request.userId,
      });

      const displayName = getToolDisplayName(result.originalAction);
      const renderData: ActionCardRenderData = {
        type: 'ACTION_CARD',
        actionId,
        toolName: result.originalAction,
        displayName,
        module: '',
        status: 'CANCELLED', // Use CANCELLED visually since UNDONE is not in ActionCardRenderData
        fields: [
          { label: 'Status', value: 'Desfeita', type: 'badge' },
          { label: 'Entidade', value: result.entityType, type: 'text' },
        ],
      };

      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        `A ação "${displayName}" foi desfeita com sucesso. ${result.message}`,
        'ACTION_CARD',
        renderData as unknown as Record<string, unknown>,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        `Não foi possível desfazer a ação: ${message}`,
        'TEXT',
        null,
      );
    }
  }

  // ── Undo the last executed action in this conversation ──────────────

  private async handleUndoLastAction(
    conversationId: string,
    request: SendMessageRequest,
    userMessage: {
      id: { toString(): string };
      role: string;
      content: string | null;
      contentType: string;
      createdAt: Date;
    },
  ) {
    // Find the last EXECUTED action in this conversation
    const lastAction =
      await this.actionLogsRepository.findLastExecutedByConversation(
        conversationId,
        request.tenantId,
      );

    if (!lastAction) {
      return this.buildActionResponse(
        conversationId,
        request,
        userMessage,
        'Nenhuma ação executada encontrada nesta conversa para desfazer.',
        'TEXT',
        null,
      );
    }

    return this.handleUndoAction(
      lastAction.id,
      conversationId,
      request,
      userMessage,
    );
  }

  // ── Extract entity ID from tool execution result ────────────────────

  private extractEntityId(
    result: Record<string, unknown> | undefined,
    actionLog: {
      targetEntityId: string | null;
      input: Record<string, unknown>;
    },
  ): string | null {
    // If we already have the entity ID from the action log, use it
    if (actionLog.targetEntityId) {
      return actionLog.targetEntityId;
    }

    if (!result) return null;

    // Try to extract from the execution result
    // Handlers typically return { success: true, product: { id: '...' }, ... }
    // or { success: true, id: '...' }
    if (typeof result.id === 'string') {
      return result.id;
    }

    // Check common nested patterns
    for (const key of Object.keys(result)) {
      const value = result[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = value as Record<string, unknown>;
        if (typeof nested.id === 'string') {
          return nested.id;
        }
      }
    }

    // Try from input args (e.g., productId, employeeId, etc.)
    const input = actionLog.input;
    for (const key of Object.keys(input)) {
      if (key.endsWith('Id') && typeof input[key] === 'string') {
        return input[key] as string;
      }
    }

    return null;
  }
}
