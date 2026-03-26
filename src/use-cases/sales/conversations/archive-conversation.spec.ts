import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ArchiveConversationUseCase } from './archive-conversation';

let conversationsRepository: InMemoryConversationsRepository;
let archiveConversation: ArchiveConversationUseCase;

describe('ArchiveConversationUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    archiveConversation = new ArchiveConversationUseCase(
      conversationsRepository,
    );
  });

  it('should archive a closed conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
      status: 'CLOSED',
    });

    const result = await archiveConversation.execute({
      tenantId: 'tenant-1',
      conversationId: conversation.id.toString(),
    });

    expect(result.conversation.status).toBe('ARCHIVED');
  });

  it('should not archive an open conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    await expect(() =>
      archiveConversation.execute({
        tenantId: 'tenant-1',
        conversationId: conversation.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      archiveConversation.execute({
        tenantId: 'tenant-1',
        conversationId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
