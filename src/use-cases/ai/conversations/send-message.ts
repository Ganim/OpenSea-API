import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import type { AiMessagesRepository } from '@/repositories/ai/ai-messages-repository';
import type { AiTenantConfigRepository } from '@/repositories/ai/ai-tenant-config-repository';
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
import { STOCK_INSTRUCTIONS } from '@/services/ai-tools/instructions/stock-instructions';

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

export class SendMessageUseCase {
  constructor(
    private conversationsRepository: AiConversationsRepository,
    private messagesRepository: AiMessagesRepository,
    private configRepository: AiTenantConfigRepository,
    private aiRouter: AiRouter,
    private toolRegistry: ToolRegistry,
    private toolExecutor: ToolExecutor,
  ) {}

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
      `Seu nome é ${assistantName}.`,
      personalityPrompt,
      `Responda sempre em ${language}.`,
      'Você faz parte de um sistema ERP chamado OpenSea.',
      'Ajude o usuário com questões relacionadas ao gerenciamento do negócio.',
    ];

    // Append stock instructions if user has any stock permission
    const hasStockPermissions = (request.userPermissions ?? []).some((p) =>
      p.startsWith('stock.'),
    );
    if (hasStockPermissions) {
      systemPromptParts.push(STOCK_INSTRUCTIONS);
    }

    const systemPrompt = systemPromptParts.join(' ');

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

    const assistantMessage = await this.messagesRepository.create({
      conversationId,
      role: 'ASSISTANT',
      content: aiContent,
      contentType: 'TEXT',
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
}
