import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Conversation } from '@/entities/sales/conversation';
import { ConversationMessage } from '@/entities/sales/conversation-message';
import { InMemoryConversationMessagesRepository } from '@/repositories/sales/in-memory/in-memory-conversation-messages-repository';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetConversationSentimentUseCase } from './get-conversation-sentiment';

let conversationsRepository: InMemoryConversationsRepository;
let conversationMessagesRepository: InMemoryConversationMessagesRepository;
let getConversationSentiment: GetConversationSentimentUseCase;

const TENANT_ID = 'tenant-1';

describe('GetConversationSentimentUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    conversationMessagesRepository =
      new InMemoryConversationMessagesRepository();
    getConversationSentiment = new GetConversationSentimentUseCase(
      conversationsRepository,
      conversationMessagesRepository,
    );
  });

  it('should return sentiment summary for a conversation', async () => {
    const conversation = Conversation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      subject: 'Feedback',
      createdBy: 'user-1',
    });
    conversation.overallSentiment = 'POSITIVE';
    conversationsRepository.items.push(conversation);

    const message = ConversationMessage.create({
      conversationId: conversation.id,
      senderName: 'Customer',
      senderType: 'CUSTOMER',
      content: 'Great product!',
    });
    message.sentiment = 'POSITIVE';
    conversationMessagesRepository.items.push(message);

    const result = await getConversationSentiment.execute({
      tenantId: TENANT_ID,
      conversationId: conversation.id.toString(),
    });

    expect(result.overallSentiment).toBe('POSITIVE');
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].sentiment).toBe('POSITIVE');
  });

  it('should return null sentiment when not analyzed', async () => {
    const conversation = Conversation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      subject: 'Test',
      createdBy: 'user-1',
    });
    conversationsRepository.items.push(conversation);

    const result = await getConversationSentiment.execute({
      tenantId: TENANT_ID,
      conversationId: conversation.id.toString(),
    });

    expect(result.overallSentiment).toBeNull();
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      getConversationSentiment.execute({
        tenantId: TENANT_ID,
        conversationId: 'nonexistent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
