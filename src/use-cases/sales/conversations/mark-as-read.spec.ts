import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConversationMessagesRepository } from '@/repositories/sales/in-memory/in-memory-conversation-messages-repository';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkAsReadUseCase } from './mark-as-read';

let conversationsRepository: InMemoryConversationsRepository;
let messagesRepository: InMemoryConversationMessagesRepository;
let markAsRead: MarkAsReadUseCase;

describe('MarkAsReadUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    messagesRepository = new InMemoryConversationMessagesRepository();
    markAsRead = new MarkAsReadUseCase(
      conversationsRepository,
      messagesRepository,
    );
  });

  it('should mark all unread messages as read', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    await messagesRepository.create({
      conversationId: conversation.id.toString(),
      senderName: 'Agent',
      content: 'Message 1',
    });

    await messagesRepository.create({
      conversationId: conversation.id.toString(),
      senderName: 'Customer',
      content: 'Message 2',
    });

    await markAsRead.execute({
      tenantId: 'tenant-1',
      conversationId: conversation.id.toString(),
    });

    const messages = await messagesRepository.findByConversationId(
      conversation.id,
    );

    expect(messages[0].readAt).toBeDefined();
    expect(messages[1].readAt).toBeDefined();
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      markAsRead.execute({
        tenantId: 'tenant-1',
        conversationId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
