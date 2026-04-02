import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import type { AiMessagesRepository } from '@/repositories/ai/ai-messages-repository';
import { GetConversationUseCase } from './get-conversation';

describe('GetConversationUseCase', () => {
  let sut: GetConversationUseCase;
  let conversationsRepository: AiConversationsRepository;
  let messagesRepository: AiMessagesRepository;

  const mockConversation = {
    id: { toString: () => 'conv-1' },
    tenantId: { toString: () => 'tenant-1' },
    userId: { toString: () => 'user-1' },
    title: 'Test Conversation',
    status: 'ACTIVE',
    context: 'DEDICATED',
    contextModule: null,
    contextEntityType: null,
    contextEntityId: null,
    messageCount: 5,
    lastMessageAt: new Date(),
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never;

  beforeEach(() => {
    conversationsRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
      updateMessageCount: vi.fn(),
    };

    messagesRepository = {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ messages: [], total: 0 }),
    };

    sut = new GetConversationUseCase(
      conversationsRepository,
      messagesRepository,
    );
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
      ...mockConversation,
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

  it('should return conversation with messages and pagination', async () => {
    vi.mocked(conversationsRepository.findById).mockResolvedValue(
      mockConversation,
    );

    const mockMessage = {
      id: { toString: () => 'msg-1' },
      conversationId: { toString: () => 'conv-1' },
      role: 'USER',
      content: 'Hello',
      contentType: 'TEXT',
      renderData: null,
      attachments: null,
      aiModel: null,
      aiLatencyMs: null,
      toolCalls: null,
      actionsTaken: null,
      audioUrl: null,
      transcription: null,
      createdAt: new Date(),
    };

    vi.mocked(messagesRepository.findMany).mockResolvedValue({
      messages: [mockMessage] as never,
      total: 1,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      conversationId: 'conv-1',
    });

    expect(result.conversation.id).toBe('conv-1');
    expect(result.messages).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('should cap limit at 100', async () => {
    vi.mocked(conversationsRepository.findById).mockResolvedValue(
      mockConversation,
    );

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      conversationId: 'conv-1',
      limit: 500,
    });

    expect(messagesRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });
});
