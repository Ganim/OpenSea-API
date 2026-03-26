import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationMessagesRepository } from '@/repositories/sales/conversation-messages-repository';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface MarkAsReadUseCaseRequest {
  tenantId: string;
  conversationId: string;
}

export class MarkAsReadUseCase {
  constructor(
    private conversationsRepository: ConversationsRepository,
    private conversationMessagesRepository: ConversationMessagesRepository,
  ) {}

  async execute(input: MarkAsReadUseCaseRequest): Promise<void> {
    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    await this.conversationMessagesRepository.markAsRead(conversation.id);
  }
}
