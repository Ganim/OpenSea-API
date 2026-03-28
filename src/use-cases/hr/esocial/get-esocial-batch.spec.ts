import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialBatch: {
      findFirst: mockFindFirst,
    },
  },
}));

import { GetEsocialBatchUseCase } from './get-esocial-batch';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-get-batch';
const BATCH_ID = 'batch-abc-123';

function makeBatchRecordWithEvents(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: BATCH_ID,
    tenantId: TENANT_ID,
    protocol: 'PROT-99887766',
    status: 'TRANSMITTED',
    environment: 'HOMOLOGACAO',
    totalEvents: 3,
    acceptedCount: 2,
    rejectedCount: 1,
    transmittedAt: new Date('2026-03-15T10:00:00.000Z'),
    checkedAt: null,
    errorMessage: null,
    retryCount: 0,
    nextRetryAt: null,
    createdBy: 'user-transmitter',
    createdAt: now,
    events: [
      {
        id: 'event-1',
        eventType: 'S-2200',
        description: 'Admissão João',
        status: 'ACCEPTED',
        referenceName: 'João Silva',
        receipt: 'REC-001',
        rejectionCode: null,
        rejectionMessage: null,
      },
      {
        id: 'event-2',
        eventType: 'S-1200',
        description: 'Remuneração Maria',
        status: 'REJECTED',
        referenceName: 'Maria Santos',
        receipt: null,
        rejectionCode: 'ERR-CPF',
        rejectionMessage: 'CPF inválido',
      },
    ],
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GetEsocialBatchUseCase', () => {
  let sut: GetEsocialBatchUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetEsocialBatchUseCase();
  });

  it('should return batch with all fields and events', async () => {
    mockFindFirst.mockResolvedValue(makeBatchRecordWithEvents());

    const { batch } = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(batch.id).toBe(BATCH_ID);
    expect(batch.protocol).toBe('PROT-99887766');
    expect(batch.status).toBe('TRANSMITTED');
    expect(batch.environment).toBe('HOMOLOGACAO');
    expect(batch.totalEvents).toBe(3);
    expect(batch.acceptedCount).toBe(2);
    expect(batch.rejectedCount).toBe(1);
    expect(batch.retryCount).toBe(0);
    expect(batch.createdBy).toBe('user-transmitter');
    expect(batch.events).toHaveLength(2);
  });

  it('should throw when batch is not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, batchId: 'nonexistent' }),
    ).rejects.toThrow('Lote não encontrado.');
  });

  it('should query with include for events', async () => {
    mockFindFirst.mockResolvedValue(makeBatchRecordWithEvents());

    await sut.execute({ tenantId: TENANT_ID, batchId: BATCH_ID });

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: BATCH_ID, tenantId: TENANT_ID },
      include: {
        events: {
          select: {
            id: true,
            eventType: true,
            description: true,
            status: true,
            referenceName: true,
            receipt: true,
            rejectionCode: true,
            rejectionMessage: true,
          },
        },
      },
    });
  });

  it('should return ISO strings for date fields', async () => {
    const transmittedAt = new Date('2026-03-15T10:00:00.000Z');
    const checkedAt = new Date('2026-03-15T11:30:00.000Z');
    const createdAt = new Date('2026-03-15T09:00:00.000Z');
    const nextRetryAt = new Date('2026-03-15T12:00:00.000Z');

    mockFindFirst.mockResolvedValue(
      makeBatchRecordWithEvents({
        transmittedAt,
        checkedAt,
        createdAt,
        nextRetryAt,
      }),
    );

    const { batch } = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(batch.transmittedAt).toBe('2026-03-15T10:00:00.000Z');
    expect(batch.checkedAt).toBe('2026-03-15T11:30:00.000Z');
    expect(batch.createdAt).toBe('2026-03-15T09:00:00.000Z');
    expect(batch.nextRetryAt).toBe('2026-03-15T12:00:00.000Z');
  });

  it('should return null for nullable date fields when not set', async () => {
    mockFindFirst.mockResolvedValue(
      makeBatchRecordWithEvents({
        transmittedAt: null,
        checkedAt: null,
        nextRetryAt: null,
      }),
    );

    const { batch } = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(batch.transmittedAt).toBeNull();
    expect(batch.checkedAt).toBeNull();
    expect(batch.nextRetryAt).toBeNull();
  });

  it('should return event details with rejection info', async () => {
    mockFindFirst.mockResolvedValue(makeBatchRecordWithEvents());

    const { batch } = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    const acceptedEvent = batch.events.find((e) => e.id === 'event-1');
    const rejectedEvent = batch.events.find((e) => e.id === 'event-2');

    expect(acceptedEvent?.status).toBe('ACCEPTED');
    expect(acceptedEvent?.receipt).toBe('REC-001');
    expect(acceptedEvent?.rejectionCode).toBeNull();

    expect(rejectedEvent?.status).toBe('REJECTED');
    expect(rejectedEvent?.rejectionCode).toBe('ERR-CPF');
    expect(rejectedEvent?.rejectionMessage).toBe('CPF inválido');
  });

  it('should return batch with empty events array', async () => {
    mockFindFirst.mockResolvedValue(
      makeBatchRecordWithEvents({
        events: [],
        totalEvents: 0,
      }),
    );

    const { batch } = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(batch.events).toEqual([]);
  });

  it('should return error batch info', async () => {
    mockFindFirst.mockResolvedValue(
      makeBatchRecordWithEvents({
        status: 'ERROR',
        errorMessage: 'Connection refused to government endpoint',
        retryCount: 2,
        nextRetryAt: new Date('2026-03-15T13:00:00.000Z'),
      }),
    );

    const { batch } = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(batch.status).toBe('ERROR');
    expect(batch.errorMessage).toBe(
      'Connection refused to government endpoint',
    );
    expect(batch.retryCount).toBe(2);
  });
});
