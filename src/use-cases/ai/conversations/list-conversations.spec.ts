import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import { ListConversationsUseCase } from './list-conversations';

describe('ListConversationsUseCase', () => {
  let sut: ListConversationsUseCase;
  let conversationsRepository: AiConversationsRepository;

  beforeEach(() => {
    conversationsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ conversations: [], total: 0 }),
      archive: vi.fn(),
      updateMessageCount: vi.fn(),
    };

    sut = new ListConversationsUseCase(conversationsRepository);
  });

  it('should list conversations with default pagination', async () => {
    const mockConv = {
      id: { toString: () => 'conv-1' },
      tenantId: { toString: () => 'tenant-1' },
      userId: { toString: () => 'user-1' },
      title: 'Test',
      status: 'ACTIVE',
      context: 'DEDICATED',
      contextModule: null,
      messageCount: 3,
      lastMessageAt: new Date(),
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(conversationsRepository.findMany).mockResolvedValue({
      conversations: [mockConv] as never,
      total: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0].id).toBe('conv-1');
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('should cap limit at 100', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      limit: 500,
    });

    expect(conversationsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('should pass search and status filters', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      search: 'test query',
      status: 'ARCHIVED',
    });

    expect(conversationsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test query',
        status: 'ARCHIVED',
      }),
    );
  });
});
