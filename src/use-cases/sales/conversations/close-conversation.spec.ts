import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CloseConversationUseCase } from './close-conversation';

let conversationsRepository: InMemoryConversationsRepository;
let closeConversation: CloseConversationUseCase;

describe('CloseConversationUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    closeConversation = new CloseConversationUseCase(conversationsRepository);
  });

  it('should close an open conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    const result = await closeConversation.execute({
      tenantId: 'tenant-1',
      conversationId: conversation.id.toString(),
    });

    expect(result.conversation.status).toBe('CLOSED');
  });

  it('should not close an already closed conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
      status: 'CLOSED',
    });

    await expect(() =>
      closeConversation.execute({
        tenantId: 'tenant-1',
        conversationId: conversation.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      closeConversation.execute({
        tenantId: 'tenant-1',
        conversationId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
