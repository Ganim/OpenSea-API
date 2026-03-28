import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const { mockFindMany, mockUpdate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialEvent: {
      findMany: mockFindMany,
      update: mockUpdate,
    },
  },
}));

import { BulkApproveEventsUseCase } from './bulk-approve-events';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-bulk-approve';
const USER_ID = 'user-approver';

function makeEventRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: `event-${Math.random().toString(36).slice(2, 8)}`,
    tenantId: TENANT_ID,
    eventType: 'S-2200',
    description: 'Admissão de Trabalhador',
    status: 'DRAFT',
    xmlContent: '<xml>valid</xml>',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BulkApproveEventsUseCase', () => {
  let sut: BulkApproveEventsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new BulkApproveEventsUseCase();
    mockUpdate.mockResolvedValue({});
  });

  it('should approve all DRAFT events with xmlContent', async () => {
    const draftEvents = [
      makeEventRecord({ id: 'ev-1', status: 'DRAFT' }),
      makeEventRecord({ id: 'ev-2', status: 'DRAFT' }),
    ];
    mockFindMany.mockResolvedValue(draftEvents);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-1', 'ev-2'],
      userId: USER_ID,
    });

    expect(result.approvedCount).toBe(2);
    expect(result.skippedCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('should approve REVIEWED events', async () => {
    const reviewedEvents = [
      makeEventRecord({ id: 'ev-1', status: 'REVIEWED' }),
    ];
    mockFindMany.mockResolvedValue(reviewedEvents);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-1'],
      userId: USER_ID,
    });

    expect(result.approvedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
  });

  it('should set approvedBy and approvedAt on approved events', async () => {
    mockFindMany.mockResolvedValue([
      makeEventRecord({ id: 'ev-1', status: 'DRAFT' }),
    ]);

    await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-1'],
      userId: USER_ID,
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'ev-1' },
      data: {
        status: 'APPROVED',
        approvedBy: USER_ID,
        approvedAt: expect.any(Date),
      },
    });
  });

  it('should skip events with invalid status (ACCEPTED, REJECTED, etc.)', async () => {
    const mixedEvents = [
      makeEventRecord({ id: 'ev-1', status: 'ACCEPTED' }),
      makeEventRecord({ id: 'ev-2', status: 'TRANSMITTING' }),
      makeEventRecord({ id: 'ev-3', status: 'REJECTED' }),
    ];
    mockFindMany.mockResolvedValue(mixedEvents);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-1', 'ev-2', 'ev-3'],
      userId: USER_ID,
    });

    expect(result.approvedCount).toBe(0);
    expect(result.skippedCount).toBe(3);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0].reason).toContain('ACCEPTED');
    expect(result.errors[1].reason).toContain('TRANSMITTING');
    expect(result.errors[2].reason).toContain('REJECTED');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should skip events without xmlContent', async () => {
    mockFindMany.mockResolvedValue([
      makeEventRecord({ id: 'ev-1', status: 'DRAFT', xmlContent: null }),
    ]);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-1'],
      userId: USER_ID,
    });

    expect(result.approvedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0].reason).toContain('sem conteúdo XML');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should handle partial success with mixed valid/invalid events', async () => {
    const mixedEvents = [
      makeEventRecord({
        id: 'ev-1',
        status: 'DRAFT',
        xmlContent: '<xml>ok</xml>',
      }),
      makeEventRecord({
        id: 'ev-2',
        status: 'ACCEPTED',
        xmlContent: '<xml>ok</xml>',
      }),
      makeEventRecord({
        id: 'ev-3',
        status: 'REVIEWED',
        xmlContent: null,
      }),
      makeEventRecord({
        id: 'ev-4',
        status: 'REVIEWED',
        xmlContent: '<xml>ok</xml>',
      }),
    ];
    mockFindMany.mockResolvedValue(mixedEvents);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-1', 'ev-2', 'ev-3', 'ev-4'],
      userId: USER_ID,
    });

    expect(result.approvedCount).toBe(2); // ev-1 (DRAFT) + ev-4 (REVIEWED)
    expect(result.skippedCount).toBe(2); // ev-2 (ACCEPTED) + ev-3 (no XML)
    expect(result.errors).toHaveLength(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);
  });

  it('should report events not found in the database', async () => {
    mockFindMany.mockResolvedValue([
      makeEventRecord({ id: 'ev-1', status: 'DRAFT' }),
    ]);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-1', 'ev-not-found-1', 'ev-not-found-2'],
      userId: USER_ID,
    });

    expect(result.approvedCount).toBe(1);
    expect(result.skippedCount).toBe(2);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toEqual({
      id: 'ev-not-found-1',
      reason: 'Evento não encontrado.',
    });
    expect(result.errors[1]).toEqual({
      id: 'ev-not-found-2',
      reason: 'Evento não encontrado.',
    });
  });

  it('should query only the requested eventIds for the tenant', async () => {
    mockFindMany.mockResolvedValue([]);

    await sut.execute({
      tenantId: TENANT_ID,
      eventIds: ['ev-a', 'ev-b', 'ev-c'],
      userId: USER_ID,
    });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['ev-a', 'ev-b', 'ev-c'] },
        tenantId: TENANT_ID,
      },
    });
  });

  it('should handle empty eventIds array', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      eventIds: [],
      userId: USER_ID,
    });

    expect(result.approvedCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
