import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';

interface ArchiveConversationRequest {
  tenantId: string;
  userId: string;
  conversationId: string;
}

export class ArchiveConversationUseCase {
  constructor(private conversationsRepository: AiConversationsRepository) {}

  async execute(request: ArchiveConversationRequest) {
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

    await this.conversationsRepository.archive(request.conversationId, request.tenantId);

    return { success: true };
  }
}
