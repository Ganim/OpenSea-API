import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListConversationsUseCase } from './list-conversations';

let conversationsRepository: InMemoryConversationsRepository;
let listConversations: ListConversationsUseCase;

describe('ListConversationsUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    listConversations = new ListConversationsUseCase(conversationsRepository);
  });

  it('should list conversations with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      await conversationsRepository.create({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        subject: `Conversation ${i}`,
        createdBy: 'user-1',
      });
    }

    const result = await listConversations.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 10,
    });

    expect(result.conversations).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should filter conversations by status', async () => {
    await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Open convo',
      createdBy: 'user-1',
      status: 'OPEN',
    });

    await conversationsRepository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Closed convo',
      createdBy: 'user-1',
      status: 'CLOSED',
    });

    const result = await listConversations.execute({
      tenantId: 'tenant-1',
      status: 'OPEN',
    });

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].status).toBe('OPEN');
  });

  it('should return empty list for tenant with no conversations', async () => {
    const result = await listConversations.execute({
      tenantId: 'tenant-1',
    });

    expect(result.conversations).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
