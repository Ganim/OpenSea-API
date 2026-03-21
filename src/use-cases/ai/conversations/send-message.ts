import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import type { AiMessagesRepository } from '@/repositories/ai/ai-messages-repository';
import type { AiTenantConfigRepository } from '@/repositories/ai/ai-tenant-config-repository';
import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { AiProviderMessage, AiTier } from '@/services/ai-provider/ai-provider.interface';

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
}

const PERSONALITY_PROMPTS: Record<string, string> = {
  PROFESSIONAL: 'Você é um assistente empresarial profissional, objetivo e eficiente.',
  FRIENDLY: 'Você é um assistente empresarial simpático e acessível, mantendo profissionalismo.',
  TECHNICAL: 'Você é um assistente empresarial técnico, preciso e detalhista.',
  CASUAL: 'Você é um assistente empresarial descontraído, mas sempre útil e informativo.',
};

export class SendMessageUseCase {
  constructor(
    private conversationsRepository: AiConversationsRepository,
    private messagesRepository: AiMessagesRepository,
    private configRepository: AiTenantConfigRepository,
    private aiRouter: AiRouter,
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
        : PERSONALITY_PROMPTS[personality] ?? PERSONALITY_PROMPTS.PROFESSIONAL;

    const systemPrompt = [
      `Seu nome é ${assistantName}.`,
      personalityPrompt,
      `Responda sempre em ${language}.`,
      'Você faz parte de um sistema ERP chamado OpenSea.',
      'Ajude o usuário com questões relacionadas ao gerenciamento do negócio.',
    ].join(' ');

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
      if (msg.content) {
        aiMessages.push({
          role: msg.role === 'USER' ? 'user' : 'assistant',
          content: msg.content,
        });
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

    const availableTiers = this.aiRouter.getAvailableTiers();

    if (availableTiers.length === 0) {
      // No providers configured — return helpful fallback
      aiContent = `Olá! Sou o ${assistantName}. No momento, nenhum provedor de IA está configurado. Por favor, configure as chaves de API (GROQ_API_KEY ou ANTHROPIC_API_KEY) nas variáveis de ambiente para habilitar respostas inteligentes.`;
      aiModel = 'fallback';
    } else {
      try {
        const response = await this.aiRouter.complete(aiMessages, tier);
        aiContent = response.content;
        aiModel = response.model;
        aiTokensInput = response.tokensInput;
        aiTokensOutput = response.tokensOutput;
        aiLatencyMs = response.latencyMs;
        aiCost = response.estimatedCost;
        usedTier = response.tier;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(`[AI Provider Error] Tier ${tier}: ${errorMessage}`);

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
