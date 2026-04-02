import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import { ArchiveConversationUseCase } from './archive-conversation';

describe('ArchiveConversationUseCase', () => {
  let sut: ArchiveConversationUseCase;
  let conversationsRepository: AiConversationsRepository;

  beforeEach(() => {
    conversationsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
      updateMessageCount: vi.fn(),
    };

    sut = new ArchiveConversationUseCase(conversationsRepository);
  });

  it('should throw if conversation not found', async () => {
    vi.mocked(conversationsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        conversationId: 'conv-1',
      }),
    ).rejects.toThrow('Conversation not found');
  });

  it('should throw if conversation belongs to different user', async () => {
    vi.mocked(conversationsRepository.findById).mockResolvedValue({
      userId: { toString: () => 'user-2' },
    } as never);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        conversationId: 'conv-1',
      }),
    ).rejects.toThrow('Conversation not found');
  });

  it('should archive conversation successfully', async () => {
    vi.mocked(conversationsRepository.findById).mockResolvedValue({
      userId: { toString: () => 'user-1' },
    } as never);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      conversationId: 'conv-1',
    });

    expect(conversationsRepository.archive).toHaveBeenCalledWith(
      'conv-1',
      'tenant-1',
    );
    expect(result.success).toBe(true);
  });
});
