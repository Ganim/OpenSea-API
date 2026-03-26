import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import { conversationToDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface CloseConversationUseCaseRequest {
  tenantId: string;
  conversationId: string;
}

interface CloseConversationUseCaseResponse {
  conversation: ConversationDTO;
}

export class CloseConversationUseCase {
  constructor(private conversationsRepository: ConversationsRepository) {}

  async execute(
    input: CloseConversationUseCaseRequest,
  ): Promise<CloseConversationUseCaseResponse> {
    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    if (conversation.status !== 'OPEN') {
      throw new BadRequestError(
        'Only open conversations can be closed.',
      );
    }

    conversation.close();
    await this.conversationsRepository.save(conversation);

    return {
      conversation: conversationToDTO(conversation),
    };
  }
}
