import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface DeleteConversationUseCaseRequest {
  tenantId: string;
  conversationId: string;
}

export class DeleteConversationUseCase {
  constructor(private conversationsRepository: ConversationsRepository) {}

  async execute(input: DeleteConversationUseCaseRequest): Promise<void> {
    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    await this.conversationsRepository.delete(
      conversation.id,
      input.tenantId,
    );
  }
}
