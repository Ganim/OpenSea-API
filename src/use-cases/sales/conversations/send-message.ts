import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationMessageDTO } from '@/mappers/sales/conversation/conversation-message-to-dto';
import { conversationMessageToDTO } from '@/mappers/sales/conversation/conversation-message-to-dto';
import type { ConversationMessagesRepository } from '@/repositories/sales/conversation-messages-repository';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface SendMessageUseCaseRequest {
  tenantId: string;
  conversationId: string;
  senderId?: string;
  senderName: string;
  senderType?: string;
  content: string;
}

interface SendMessageUseCaseResponse {
  message: ConversationMessageDTO;
}

export class SendMessageUseCase {
  constructor(
    private conversationsRepository: ConversationsRepository,
    private conversationMessagesRepository: ConversationMessagesRepository,
  ) {}

  async execute(
    input: SendMessageUseCaseRequest,
  ): Promise<SendMessageUseCaseResponse> {
    if (!input.content || input.content.trim().length === 0) {
      throw new BadRequestError('Message content is required.');
    }

    if (!input.senderName || input.senderName.trim().length === 0) {
      throw new BadRequestError('Sender name is required.');
    }

    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    if (conversation.status !== 'OPEN') {
      throw new BadRequestError(
        'Cannot send messages to a conversation that is not open.',
      );
    }

    const message = await this.conversationMessagesRepository.create({
      conversationId: input.conversationId,
      senderId: input.senderId,
      senderName: input.senderName.trim(),
      senderType: input.senderType ?? 'AGENT',
      content: input.content.trim(),
    });

    conversation.lastMessageAt = new Date();
    await this.conversationsRepository.save(conversation);

    return {
      message: conversationMessageToDTO(message),
    };
  }
}
