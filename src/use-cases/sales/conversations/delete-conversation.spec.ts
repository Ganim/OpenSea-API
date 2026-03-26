import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteConversationUseCase } from './delete-conversation';

let conversationsRepository: InMemoryConversationsRepository;
let deleteConversation: DeleteConversationUseCase;

describe('DeleteConversationUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    deleteConversation = new DeleteConversationUseCase(conversationsRepository);
  });

  it('should soft delete a conversation', async () => {
    const conversation = await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Test',
      createdBy: 'user-1',
    });

    await deleteConversation.execute({
      tenantId: 'tenant-1',
      conversationId: conversation.id.toString(),
    });

    const deleted = await conversationsRepository.findById(
      conversation.id,
      'tenant-1',
    );

    expect(deleted).toBeNull();
  });

  it('should throw when conversation is not found', async () => {
    await expect(() =>
      deleteConversation.execute({
        tenantId: 'tenant-1',
        conversationId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
