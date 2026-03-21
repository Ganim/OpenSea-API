import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import type { AiMessagesRepository } from '@/repositories/ai/ai-messages-repository';

interface GetConversationRequest {
  tenantId: string;
  userId: string;
  conversationId: string;
  page?: number;
  limit?: number;
}

export class GetConversationUseCase {
  constructor(
    private conversationsRepository: AiConversationsRepository,
    private messagesRepository: AiMessagesRepository,
  ) {}

  async execute(request: GetConversationRequest) {
    const conversation = await this.conversationsRepository.findById(
      request.conversationId,
      request.tenantId,
    );

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.userId.toString() !== request.userId) {
      throw new Error('Conversation not found');
    }

    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 50, 100);

    const { messages, total } = await this.messagesRepository.findMany({
      conversationId: request.conversationId,
      page,
      limit,
    });

    return {
      conversation: {
        id: conversation.id.toString(),
        tenantId: conversation.tenantId.toString(),
        userId: conversation.userId.toString(),
        title: conversation.title,
        status: conversation.status,
        context: conversation.context,
        contextModule: conversation.contextModule,
        contextEntityType: conversation.contextEntityType,
        contextEntityId: conversation.contextEntityId,
        messageCount: conversation.messageCount,
        lastMessageAt: conversation.lastMessageAt,
        isPinned: conversation.isPinned,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: messages.map((m) => ({
        id: m.id.toString(),
        conversationId: m.conversationId.toString(),
        role: m.role,
        content: m.content,
        contentType: m.contentType,
        renderData: m.renderData,
        attachments: m.attachments,
        aiModel: m.aiModel,
        aiLatencyMs: m.aiLatencyMs,
        toolCalls: m.toolCalls,
        actionsTaken: m.actionsTaken,
        audioUrl: m.audioUrl,
        transcription: m.transcription,
        createdAt: m.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
