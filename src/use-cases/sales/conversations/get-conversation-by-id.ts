import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { conversationMessageToDTO } from '@/mappers/sales/conversation/conversation-message-to-dto';
import type { ConversationDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import { conversationToDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import type { ConversationMessagesRepository } from '@/repositories/sales/conversation-messages-repository';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface GetConversationByIdUseCaseRequest {
  tenantId: string;
  conversationId: string;
}

interface GetConversationByIdUseCaseResponse {
  conversation: ConversationDTO;
}

export class GetConversationByIdUseCase {
  constructor(
    private conversationsRepository: ConversationsRepository,
    private conversationMessagesRepository: ConversationMessagesRepository,
  ) {}

  async execute(
    input: GetConversationByIdUseCaseRequest,
  ): Promise<GetConversationByIdUseCaseResponse> {
    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    const messages =
      await this.conversationMessagesRepository.findByConversationId(
        conversation.id,
      );

    const messageDTOs = messages.map(conversationMessageToDTO);

    return {
      conversation: conversationToDTO(conversation, messageDTOs),
    };
  }
}
