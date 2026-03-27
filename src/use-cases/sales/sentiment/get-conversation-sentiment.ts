import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConversationMessagesRepository } from '@/repositories/sales/conversation-messages-repository';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface GetConversationSentimentUseCaseRequest {
  tenantId: string;
  conversationId: string;
}

interface MessageSentimentSummary {
  messageId: string;
  sentiment: string | null;
  senderName: string;
  senderType: string;
  createdAt: Date;
}

interface GetConversationSentimentUseCaseResponse {
  conversationId: string;
  overallSentiment: string | null;
  messages: MessageSentimentSummary[];
}

export class GetConversationSentimentUseCase {
  constructor(
    private conversationsRepository: ConversationsRepository,
    private conversationMessagesRepository: ConversationMessagesRepository,
  ) {}

  async execute(
    input: GetConversationSentimentUseCaseRequest,
  ): Promise<GetConversationSentimentUseCaseResponse> {
    const conversation = await this.conversationsRepository.findById(
      new UniqueEntityID(input.conversationId),
      input.tenantId,
    );

    if (!conversation) {
      throw new ResourceNotFoundError('Conversation not found.');
    }

    const messages =
      await this.conversationMessagesRepository.findByConversationId(
        new UniqueEntityID(input.conversationId),
      );

    return {
      conversationId: input.conversationId,
      overallSentiment: conversation.overallSentiment ?? null,
      messages: messages.map((message) => ({
        messageId: message.id.toString(),
        sentiment: message.sentiment ?? null,
        senderName: message.senderName,
        senderType: message.senderType,
        createdAt: message.createdAt,
      })),
    };
  }
}
