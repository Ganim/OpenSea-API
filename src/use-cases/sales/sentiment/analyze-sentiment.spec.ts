import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Conversation } from '@/entities/sales/conversation';
import { ConversationMessage } from '@/entities/sales/conversation-message';
import { InMemoryConversationMessagesRepository } from '@/repositories/sales/in-memory/in-memory-conversation-messages-repository';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnalyzeSentimentUseCase } from './analyze-sentiment';

let conversationsRepository: InMemoryConversationsRepository;
let conversationMessagesRepository: InMemoryConversationMessagesRepository;
let analyzeSentiment: AnalyzeSentimentUseCase;

const TENANT_ID = 'tenant-1';

describe('AnalyzeSentimentUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    conversationMessagesRepository =
      new InMemoryConversationMessagesRepository();
    analyzeSentiment = new AnalyzeSentimentUseCase(
      conversationsRepository,
      conversationMessagesRepository,
    );
  });

  it('should analyze positive sentiment', async () => {
    const conversation = Conversation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      subject: 'Feedback',
      createdBy: 'user-1',
    });
    conversationsRepository.items.push(conversation);

    const positiveMessage = ConversationMessage.create({
      conversationId: conversation.id,
      senderName: 'Customer',
      senderType: 'CUSTOMER',
      content: 'Obrigado! O produto é excelente e perfeito!',
    });
    conversationMessagesRepository.items.push(positiveMessage);

    const result = await analyzeSentiment.execute({
      tenantId: TENANT_ID,
      conversationId: conversation.id.toString(),
    });

    expect(result.overallSentiment).toBe('POSITIVE');
    expect(result.positiveCount).toBeGreaterThan(0);
    expect(result.messageSentiments).toHaveLength(1);
    expect(result.messageSentiments[0].sentiment).toBe('POSITIVE');
  });

  it('should analyze negative sentiment', async () => {
    const conversation = Conversation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      subject: 'Complaint',
      createdBy: 'user-1',
    });
    conversationsRepository.items.push(conversation);

    const negativeMessage = ConversationMessage.create({
      conversationId: conversation.id,
      senderName: 'Customer',
      senderType: 'CUSTOMER',
      content: 'Esse produto é ruim e péssimo. Quero cancelar!',
    });
    conversationMessagesRepository.items.push(negativeMessage);

    const result = await analyzeSentiment.execute({
      tenantId: TENANT_ID,
      conversationId: conversation.id.toString(),
    });

    expect(result.overallSentiment).toBe('NEGATIVE');
    expect(result.negativeCount).toBeGreaterThan(0);
  });

  it('should analyze neutral sentiment for content without keywords', async () => {
    const conversation = Conversation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      subject: 'Inquiry',
      createdBy: 'user-1',
    });
    conversationsRepository.items.push(conversation);

    const neutralMessage = ConversationMessage.create({
      conversationId: conversation.id,
      senderName: 'Customer',
      senderType: 'CUSTOMER',
      content: 'Qual o prazo de entrega?',
    });
    conversationMessagesRepository.items.push(neutralMessage);

    const result = await analyzeSentiment.execute({
      tenantId: TENANT_ID,
      conversationId: conversation.id.toString(),
    });

    expect(result.overallSentiment).toBe('NEUTRAL');
    expect(result.neutralCount).toBeGreaterThan(0);
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      analyzeSentiment.execute({
        tenantId: TENANT_ID,
        conversationId: 'nonexistent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should update conversation overall sentiment', async () => {
    const conversation = Conversation.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      customerId: new UniqueEntityID('customer-1'),
      subject: 'Test',
      createdBy: 'user-1',
    });
    conversationsRepository.items.push(conversation);

    const positiveMessage = ConversationMessage.create({
      conversationId: conversation.id,
      senderName: 'Customer',
      senderType: 'CUSTOMER',
      content: 'Excelente! Obrigado! Perfeito!',
    });
    conversationMessagesRepository.items.push(positiveMessage);

    await analyzeSentiment.execute({
      tenantId: TENANT_ID,
      conversationId: conversation.id.toString(),
    });

    const updatedConversation = conversationsRepository.items[0];
    expect(updatedConversation.overallSentiment).toBe('POSITIVE');
  });
});
