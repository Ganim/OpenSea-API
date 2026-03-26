import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConversationMessagesRepository } from '@/repositories/sales/in-memory/in-memory-conversation-messages-repository';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetConversationByIdUseCase } from './get-conversation-by-id';

let conversationsRepository: InMemoryConversationsRepository;
let messagesRepository: InMemoryConversationMessagesRepository;
let getConversationById: GetConversationByIdUseCase;

describe('GetConversationByIdUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    messagesRepository = new InMemoryConversationMessagesRepository();
    getConversationById = new GetConversationByIdUseCase(
      conversationsRepository,
      messagesRepository,
    );
  });

  it('should get a conversation with its messages', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test conversation',
      createdBy: 'user-1',
    });

    await messagesRepository.create({
      conversationId: conversation.id.toString(),
      senderName: 'Agent Smith',
      content: 'Hello, how can I help?',
    });

    await messagesRepository.create({
      conversationId: conversation.id.toString(),
      senderName: 'Customer',
      senderType: 'CUSTOMER',
      content: 'I need help with my order.',
    });

    const result = await getConversationById.execute({
      tenantId: 'tenant-1',
      conversationId: conversation.id.toString(),
    });

    expect(result.conversation.subject).toBe('Test conversation');
    expect(result.conversation.messages).toHaveLength(2);
    expect(result.conversation.messages![0].content).toBe(
      'Hello, how can I help?',
    );
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      getConversationById.execute({
        tenantId: 'tenant-1',
        conversationId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
