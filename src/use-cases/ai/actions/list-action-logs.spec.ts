import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AiActionLogsRepository } from '@/repositories/ai/ai-action-logs-repository';
import { ListActionLogsUseCase } from './list-action-logs';

describe('ListActionLogsUseCase', () => {
  let sut: ListActionLogsUseCase;
  let actionLogsRepository: AiActionLogsRepository;

  beforeEach(() => {
    actionLogsRepository = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findLastExecutedByConversation: vi.fn(),
      findMany: vi.fn().mockResolvedValue({ actions: [], total: 0 }),
    };

    sut = new ListActionLogsUseCase(actionLogsRepository);
  });

  it('should list action logs with default pagination', async () => {
    vi.mocked(actionLogsRepository.findMany).mockResolvedValue({
      actions: [{ id: 'log-1' }, { id: 'log-2' }] as never,
      total: 2,
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(actionLogsRepository.findMany).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: undefined,
      status: undefined,
      targetModule: undefined,
      page: 1,
      limit: 20,
    });
    expect(result.actions).toHaveLength(2);
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('should respect custom page and limit', async () => {
    vi.mocked(actionLogsRepository.findMany).mockResolvedValue({
      actions: [],
      total: 50,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 3,
      limit: 10,
    });

    expect(actionLogsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, limit: 10 }),
    );
    expect(result.meta.pages).toBe(5);
  });

  it('should cap limit at 100', async () => {
    vi.mocked(actionLogsRepository.findMany).mockResolvedValue({
      actions: [],
      total: 0,
    });

    await sut.execute({ tenantId: 'tenant-1', limit: 500 });

    expect(actionLogsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('should pass filters to repository', async () => {
    vi.mocked(actionLogsRepository.findMany).mockResolvedValue({
      actions: [],
      total: 0,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: 'EXECUTED',
      targetModule: 'stock',
    });

    expect(actionLogsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        status: 'EXECUTED',
        targetModule: 'stock',
      }),
    );
  });
});
