import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import { conversationToDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface ArchiveConversationUseCaseRequest {
  tenantId: string;
  conversationId: string;
}

interface ArchiveConversationUseCaseResponse {
  conversation: ConversationDTO;
}

export class ArchiveConversationUseCase {
  constructor(private conversationsRepository: ConversationsRepository) {}

  async execute(
    input: ArchiveConversationUseCaseRequest,
  ): Promise<ArchiveConversationUseCaseResponse> {
    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    if (conversation.status !== 'CLOSED') {
      throw new BadRequestError(
        'Only closed conversations can be archived.',
      );
    }

    conversation.archive();
    await this.conversationsRepository.save(conversation);

    return {
      conversation: conversationToDTO(conversation),
    };
  }
}
