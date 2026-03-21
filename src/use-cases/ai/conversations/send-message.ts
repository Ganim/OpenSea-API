import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import type { AiMessagesRepository } from '@/repositories/ai/ai-messages-repository';

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
}

export class SendMessageUseCase {
  constructor(
    private conversationsRepository: AiConversationsRepository,
    private messagesRepository: AiMessagesRepository,
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

    // Generate AI response (placeholder — real AI integration will be added later)
    const startTime = Date.now();
    const aiResponseContent = `Entendido! Recebi sua mensagem. A integração com o provedor de IA será implementada em breve. Por enquanto, posso confirmar que sua mensagem foi registrada com sucesso.`;
    const latencyMs = Date.now() - startTime;

    const assistantMessage = await this.messagesRepository.create({
      conversationId,
      role: 'ASSISTANT',
      content: aiResponseContent,
      contentType: 'TEXT',
      aiTier: 1,
      aiModel: 'placeholder',
      aiTokensInput: 0,
      aiTokensOutput: 0,
      aiLatencyMs: latencyMs,
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
        aiLatencyMs: assistantMessage.aiLatencyMs,
        createdAt: assistantMessage.createdAt,
      },
    };
  }
}
