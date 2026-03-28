import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const { mockFindMany, mockCount } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialEvent: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

import { ListEsocialEventsUseCase } from './list-esocial-events';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-list-events';

function makeEventRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: `event-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: TENANT_ID,
    eventType: 'S-2200',
    description: 'Admissão de Trabalhador',
    status: 'DRAFT',
    referenceName: 'João da Silva',
    referenceType: 'employee',
    deadline: null,
    receipt: null,
    rejectionCode: null,
    rejectionMessage: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ListEsocialEventsUseCase', () => {
  let sut: ListEsocialEventsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new ListEsocialEventsUseCase();
  });

  it('should return paginated events with meta', async () => {
    const eventRecords = [
      makeEventRecord({ id: 'event-1' }),
      makeEventRecord({ id: 'event-2' }),
    ];
    mockFindMany.mockResolvedValue(eventRecords);
    mockCount.mockResolvedValue(5);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 2,
    });

    expect(result.events).toHaveLength(2);
    expect(result.meta).toEqual({
      total: 5,
      page: 1,
      perPage: 2,
      pages: 3,
    });
  });

  it('should filter by single status', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
      status: 'APPROVED',
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_ID,
          status: 'APPROVED',
        }),
      }),
    );
  });

  it('should filter by array of statuses', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
      status: ['DRAFT', 'REVIEWED'],
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ['DRAFT', 'REVIEWED'] },
        }),
      }),
    );
  });

  it('should filter by eventType', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
      eventType: 'S-1200',
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ eventType: 'S-1200' }),
      }),
    );
  });

  it('should search across description, referenceName, and eventType', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
      search: 'admissão',
    });

    const calledWhere = mockFindMany.mock.calls[0][0].where;
    expect(calledWhere.OR).toEqual([
      { description: { contains: 'admissão', mode: 'insensitive' } },
      { referenceName: { contains: 'admissão', mode: 'insensitive' } },
      { eventType: { contains: 'admissão', mode: 'insensitive' } },
    ]);
  });

  it('should apply correct pagination skip/take', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await sut.execute({
      tenantId: TENANT_ID,
      page: 3,
      perPage: 5,
    });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (3 - 1) * 5
        take: 5,
      }),
    );
  });

  it('should return ISO strings for date fields', async () => {
    const deadline = new Date('2026-06-30T23:59:59.000Z');
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');

    mockFindMany.mockResolvedValue([
      makeEventRecord({ deadline, createdAt, updatedAt }),
    ]);
    mockCount.mockResolvedValue(1);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    expect(result.events[0].deadline).toBe('2026-06-30T23:59:59.000Z');
    expect(result.events[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.events[0].updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('should return null deadline when event has no deadline', async () => {
    mockFindMany.mockResolvedValue([makeEventRecord({ deadline: null })]);
    mockCount.mockResolvedValue(1);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 10,
    });

    expect(result.events[0].deadline).toBeNull();
  });

  it('should calculate pages correctly', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(11);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      perPage: 5,
    });

    expect(result.meta.pages).toBe(3); // Math.ceil(11 / 5) = 3
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
});
