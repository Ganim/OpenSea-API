import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const { mockFindMany, mockCount } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialBatch: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

import { ListEsocialBatchesUseCase } from './list-esocial-batches';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-list-batches';

function makeBatchRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: `batch-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: TENANT_ID,
    protocol: null,
    status: 'PENDING',
    environment: 'HOMOLOGACAO',
    totalEvents: 5,
    acceptedCount: 0,
    rejectedCount: 0,
    transmittedAt: null,
    checkedAt: null,
    errorMessage: null,
    createdAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ListEsocialBatchesUseCase', () => {
  let sut: ListEsocialBatchesUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new ListEsocialBatchesUseCase();
  });

  it('should return paginated batches with meta', async () => {
    const batchRecords = [
      makeBatchRecord({ id: 'batch-1' }),
      makeBatchRecord({ id: 'batch-2' }),
    ];
    mockFindMany.mockResolvedValue(batchRecords);
    mockCount.mockResolvedValue(8);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 2,
    });

    expect(result.batches).toHaveLength(2);
    expect(result.meta).toEqual({
      total: 8,
      page: 1,
      perPage: 2,
      pages: 4,
    });
  });

  it('should filter by status', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
      status: 'TRANSMITTED',
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_ID, status: 'TRANSMITTED' },
      }),
    );
  });

  it('should not include status filter when not provided', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_ID },
      }),
    );
  });

  it('should apply correct pagination skip/take', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 4,
      perPage: 3,
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 9, // (4 - 1) * 3
        take: 3,
      }),
    );
  });

  it('should return ISO strings for date fields', async () => {
    const transmittedAt = new Date('2026-03-10T14:00:00.000Z');
    const checkedAt = new Date('2026-03-10T15:30:00.000Z');
    const createdAt = new Date('2026-03-10T10:00:00.000Z');

    mockFindMany.mockResolvedValue([
      makeBatchRecord({
        protocol: 'PROT-12345',
        status: 'ACCEPTED',
        totalEvents: 10,
        acceptedCount: 8,
        rejectedCount: 2,
        transmittedAt,
        checkedAt,
        createdAt,
      }),
    ]);
    mockCount.mockResolvedValue(1);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    const batch = result.batches[0];
    expect(batch.protocol).toBe('PROT-12345');
    expect(batch.transmittedAt).toBe('2026-03-10T14:00:00.000Z');
    expect(batch.checkedAt).toBe('2026-03-10T15:30:00.000Z');
    expect(batch.createdAt).toBe('2026-03-10T10:00:00.000Z');
  });

  it('should return null for nullable date fields when not set', async () => {
    mockFindMany.mockResolvedValue([
      makeBatchRecord({ transmittedAt: null, checkedAt: null }),
    ]);
    mockCount.mockResolvedValue(1);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    expect(result.batches[0].transmittedAt).toBeNull();
    expect(result.batches[0].checkedAt).toBeNull();
  });

  it('should order by createdAt descending', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('should map error message from batch record', async () => {
    mockFindMany.mockResolvedValue([
      makeBatchRecord({
        status: 'ERROR',
        errorMessage: 'Timeout connecting to government SOAP endpoint',
      }),
    ]);
    mockCount.mockResolvedValue(1);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    expect(result.batches[0].errorMessage).toBe(
      'Timeout connecting to government SOAP endpoint',
    );
  });
});
