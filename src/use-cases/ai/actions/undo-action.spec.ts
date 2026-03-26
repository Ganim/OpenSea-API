import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  AiActionLogsRepository,
  AiActionLogDTO,
} from '@/repositories/ai/ai-action-logs-repository';
import type { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';

// Mock prisma before importing UndoActionUseCase (it has a top-level import)
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

// Mock the audit module enum dynamic require
vi.mock('@/entities/audit/audit-module.enum', () => ({
  AuditModule: {
    STOCK: 'STOCK',
    FINANCE: 'FINANCE',
    HR: 'HR',
    SALES: 'SALES',
    OTHER: 'OTHER',
  },
}));

import { UndoActionUseCase } from './undo-action';

function makeActionLogDTO(
  overrides: Partial<AiActionLogDTO> = {},
): AiActionLogDTO {
  return {
    id: overrides.id ?? 'action-log-1',
    tenantId: overrides.tenantId ?? 'tenant-1',
    userId: overrides.userId ?? 'user-1',
    conversationId: overrides.conversationId ?? 'conv-1',
    messageId: overrides.messageId ?? 'msg-1',
    actionType: overrides.actionType ?? 'stock_create_product',
    targetModule: overrides.targetModule ?? 'stock',
    targetEntityType: overrides.targetEntityType ?? 'product',
    targetEntityId: overrides.targetEntityId ?? 'entity-1',
    input: overrides.input ?? { name: 'Test Product' },
    output: overrides.output ?? null,
    status: overrides.status ?? 'EXECUTED',
    confirmedByUserId: overrides.confirmedByUserId ?? null,
    confirmedAt: overrides.confirmedAt ?? null,
    executedAt: overrides.executedAt ?? new Date(),
    error: overrides.error ?? null,
    auditLogId: overrides.auditLogId ?? null,
    createdAt: overrides.createdAt ?? new Date(),
  };
}

describe('UndoActionUseCase', () => {
  let sut: UndoActionUseCase;
  let actionLogsRepository: AiActionLogsRepository;
  let auditLogsRepository: AuditLogsRepository;

  beforeEach(() => {
    actionLogsRepository = {
      findById: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({}),
      create: vi.fn(),
      findLastExecutedByConversation: vi.fn(),
      findMany: vi.fn(),
    };

    auditLogsRepository = {
      findById: vi.fn().mockResolvedValue(null),
      listByEntity: vi.fn().mockResolvedValue([]),
      log: vi.fn().mockResolvedValue({}),
      logMany: vi.fn(),
      listAll: vi.fn(),
      listRecent: vi.fn(),
      listByUserId: vi.fn(),
      listByAffectedUser: vi.fn(),
      listByModule: vi.fn(),
      listByAction: vi.fn(),
      getStatistics: vi.fn(),
      getModuleStatistics: vi.fn(),
      getUserActivitySummary: vi.fn(),
      getMostActiveUsers: vi.fn(),
      getMostAuditedEntities: vi.fn(),
      getActionTrends: vi.fn(),
      deleteOlderThan: vi.fn(),
      deleteExpired: vi.fn(),
      deleteByEntity: vi.fn(),
      deleteAll: vi.fn(),
      count: vi.fn(),
      exists: vi.fn(),
    };

    sut = new UndoActionUseCase(actionLogsRepository, auditLogsRepository);
  });

  it('should throw if action not found', async () => {
    vi.mocked(actionLogsRepository.findById).mockResolvedValue(null);

    await expect(
      sut.execute({
        actionLogId: 'nonexistent',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Ação não encontrada.');
  });

  it('should throw if action belongs to different tenant', async () => {
    vi.mocked(actionLogsRepository.findById).mockResolvedValue(
      makeActionLogDTO({ tenantId: 'tenant-2' }),
    );

    await expect(
      sut.execute({
        actionLogId: 'action-log-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Ação não pertence a este tenant.');
  });

  it('should throw if action is not EXECUTED', async () => {
    vi.mocked(actionLogsRepository.findById).mockResolvedValue(
      makeActionLogDTO({ status: 'PENDING' }),
    );

    await expect(
      sut.execute({
        actionLogId: 'action-log-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Apenas ações executadas podem ser desfeitas');
  });

  it('should throw if action status is CANCELLED', async () => {
    vi.mocked(actionLogsRepository.findById).mockResolvedValue(
      makeActionLogDTO({ status: 'CANCELLED' }),
    );

    await expect(
      sut.execute({
        actionLogId: 'action-log-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Apenas ações executadas podem ser desfeitas');
  });

  it('should throw if targetEntityId is null', async () => {
    vi.mocked(actionLogsRepository.findById).mockResolvedValue(
      makeActionLogDTO({ targetEntityId: null }),
    );

    await expect(
      sut.execute({
        actionLogId: 'action-log-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow();
  });

  it('should throw if entity type is unsupported', async () => {
    vi.mocked(actionLogsRepository.findById).mockResolvedValue(
      makeActionLogDTO({ targetEntityType: 'alien-entity-type' }),
    );

    await expect(
      sut.execute({
        actionLogId: 'action-log-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('não suportado para undo');
  });
});
