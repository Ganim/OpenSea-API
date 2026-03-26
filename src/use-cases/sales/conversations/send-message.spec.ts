import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConversationMessagesRepository } from '@/repositories/sales/in-memory/in-memory-conversation-messages-repository';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SendMessageUseCase } from './send-message';

let conversationsRepository: InMemoryConversationsRepository;
let messagesRepository: InMemoryConversationMessagesRepository;
let sendMessage: SendMessageUseCase;

describe('SendMessageUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    messagesRepository = new InMemoryConversationMessagesRepository();
    sendMessage = new SendMessageUseCase(
      conversationsRepository,
      messagesRepository,
    );
  });

  it('should send a message to an open conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    const result = await sendMessage.execute({
      tenantId: 'tenant-1',
      conversationId: conversation.id.toString(),
      senderId: 'user-1',
      senderName: 'Agent Smith',
      content: 'Hello!',
    });

    expect(result.message).toBeDefined();
    expect(result.message.content).toBe('Hello!');
    expect(result.message.senderType).toBe('AGENT');
  });

  it('should update lastMessageAt on the conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    await sendMessage.execute({
      tenantId: 'tenant-1',
      conversationId: conversation.id.toString(),
      senderName: 'Agent',
      content: 'Hello!',
    });

    const updated = await conversationsRepository.findById(
      conversation.id,
      'tenant-1',
    );

    expect(updated?.lastMessageAt).toBeDefined();
  });

  it('should not send message to a closed conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
      status: 'CLOSED',
    });

    await expect(() =>
      sendMessage.execute({
        tenantId: 'tenant-1',
        conversationId: conversation.id.toString(),
        senderName: 'Agent',
        content: 'Hello!',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow empty content', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    await expect(() =>
      sendMessage.execute({
        tenantId: 'tenant-1',
        conversationId: conversation.id.toString(),
        senderName: 'Agent',
        content: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow empty sender name', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    await expect(() =>
      sendMessage.execute({
        tenantId: 'tenant-1',
        conversationId: conversation.id.toString(),
        senderName: '',
        content: 'Hello!',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      sendMessage.execute({
        tenantId: 'tenant-1',
        conversationId: 'non-existent',
        senderName: 'Agent',
        content: 'Hello!',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
