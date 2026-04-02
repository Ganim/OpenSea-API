import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiActionLog: { update: vi.fn() },
    auditLog: { findFirst: vi.fn() },
  },
}));

vi.mock('@/use-cases/ai/actions/factories/make-undo-action-use-case', () => ({
  makeUndoActionUseCase: vi.fn(),
}));

vi.mock('@/services/ai-tools/knowledge/knowledge-prompt-builder', () => ({
  KnowledgePromptBuilder: vi.fn().mockImplementation(() => ({
    buildContextualPrompt: vi.fn().mockReturnValue(''),
  })),
}));

vi.mock('@/services/ai-tools/business-snapshot.service', () => ({
  BusinessSnapshotService: vi.fn().mockImplementation(() => ({
    getOrGenerate: vi.fn().mockResolvedValue({}),
    filterByPermissions: vi.fn().mockReturnValue({}),
  })),
}));

vi.mock('@/services/ai-tools/pending-action.service', () => ({
  buildPendingAction: vi.fn(),
  getToolDisplayName: vi.fn().mockReturnValue('Test Tool'),
}));

import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';
import type { AiMessagesRepository } from '@/repositories/ai/ai-messages-repository';
import type { AiTenantConfigRepository } from '@/repositories/ai/ai-tenant-config-repository';
import type { AiActionLogsRepository } from '@/repositories/ai/ai-action-logs-repository';
import type { AiRouter } from '@/services/ai-provider/ai-router';
import type { ToolRegistry } from '@/services/ai-tools/tool-registry';
import type { ToolExecutor } from '@/services/ai-tools/tool-executor';
import type { KnowledgeRegistry } from '@/services/ai-tools/knowledge/knowledge-registry';
import { SendMessageUseCase } from './send-message';

describe('SendMessageUseCase', () => {
  let sut: SendMessageUseCase;
  let conversationsRepository: AiConversationsRepository;
  let messagesRepository: AiMessagesRepository;
  let configRepository: AiTenantConfigRepository;
  let aiRouter: AiRouter;
  let toolRegistry: ToolRegistry;
  let toolExecutor: ToolExecutor;
  let knowledgeRegistry: KnowledgeRegistry;
  let actionLogsRepository: AiActionLogsRepository;

  beforeEach(() => {
    conversationsRepository = {
      create: vi.fn().mockResolvedValue({
        id: { toString: () => 'conv-1' },
      }),
      findById: vi.fn().mockResolvedValue({
        userId: { toString: () => 'user-1' },
        messageCount: 0,
      }),
      findMany: vi.fn(),
      archive: vi.fn(),
      updateMessageCount: vi.fn(),
    };

    messagesRepository = {
      create: vi.fn().mockImplementation((data: Record<string, unknown>) => ({
        id: { toString: () => `msg-${Date.now()}` },
        role: data.role ?? 'USER',
        content: data.content ?? null,
        contentType: data.contentType ?? 'TEXT',
        renderData: data.renderData ?? null,
        aiModel: data.aiModel ?? null,
        aiTier: data.aiTier ?? null,
        aiTokensInput: data.aiTokensInput ?? null,
        aiTokensOutput: data.aiTokensOutput ?? null,
        aiLatencyMs: data.aiLatencyMs ?? null,
        aiCost: data.aiCost ?? null,
        createdAt: new Date(),
      })),
      findMany: vi.fn().mockResolvedValue({ messages: [], total: 0 }),
    };

    configRepository = {
      findByTenantId: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    };

    aiRouter = {
      complete: vi.fn().mockResolvedValue({
        content: 'AI response',
        model: 'test-model',
        tokensInput: 50,
        tokensOutput: 20,
        latencyMs: 100,
        estimatedCost: 0.001,
        tier: 1,
      }),
      completeWithTools: vi.fn(),
      getAvailableTiers: vi.fn().mockReturnValue([1]),
    } as never;

    toolRegistry = {
      getToolsForUser: vi.fn().mockReturnValue([]),
      getAllTools: vi.fn().mockReturnValue([]),
      getTool: vi.fn(),
    } as never;

    toolExecutor = {
      execute: vi.fn(),
      executeDirect: vi.fn(),
    } as never;

    knowledgeRegistry = {} as never;

    actionLogsRepository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findLastExecutedByConversation: vi.fn(),
      findMany: vi.fn(),
    };

    sut = new SendMessageUseCase(
      conversationsRepository,
      messagesRepository,
      configRepository,
      aiRouter,
      toolRegistry,
      toolExecutor,
      knowledgeRegistry,
      actionLogsRepository,
    );
  });

  it('should create a new conversation when none provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      content: 'Hello Atlas',
    });

    expect(conversationsRepository.create).toHaveBeenCalled();
    expect(result.conversationId).toBe('conv-1');
    expect(result.userMessage).toBeDefined();
    expect(result.assistantMessage).toBeDefined();
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
        content: 'Hello',
      }),
    ).rejects.toThrow('Conversation not found');
  });

  it('should use existing conversation when provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      conversationId: 'conv-existing',
      content: 'Hello',
    });

    expect(conversationsRepository.create).not.toHaveBeenCalled();
    expect(result.conversationId).toBe('conv-existing');
  });

  it('should return fallback when no AI providers configured', async () => {
    vi.mocked(aiRouter.getAvailableTiers).mockReturnValue([]);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      content: 'Hello',
    });

    expect(result.assistantMessage.content).toContain('nenhum provedor de IA');
  });
});
