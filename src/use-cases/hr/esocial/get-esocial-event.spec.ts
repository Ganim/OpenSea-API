import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialEvent: {
      findFirst: mockFindFirst,
    },
  },
}));

import { GetEsocialEventUseCase } from './get-esocial-event';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-get-event';
const EVENT_ID = 'event-abc-123';

function makeFullEventRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: EVENT_ID,
    tenantId: TENANT_ID,
    eventType: 'S-2200',
    description: 'Admissão de Trabalhador',
    status: 'DRAFT',
    referenceId: 'emp-1',
    referenceName: 'Maria dos Santos',
    referenceType: 'employee',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-01-31'),
    deadline: new Date('2026-02-15'),
    xmlContent: '<xml>content</xml>',
    signedXml: null,
    receipt: null,
    rejectionCode: null,
    rejectionMessage: null,
    retryCount: 0,
    nextRetryAt: null,
    rectifiedEventId: null,
    batchId: null,
    createdBy: 'user-1',
    reviewedBy: null,
    reviewedAt: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GetEsocialEventUseCase', () => {
  let sut: GetEsocialEventUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetEsocialEventUseCase();
  });

  it('should return the event with all fields', async () => {
    const eventRecord = makeFullEventRecord();
    mockFindFirst.mockResolvedValue(eventRecord);

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
    });

    expect(event.id).toBe(EVENT_ID);
    expect(event.eventType).toBe('S-2200');
    expect(event.description).toBe('Admissão de Trabalhador');
    expect(event.status).toBe('DRAFT');
    expect(event.referenceId).toBe('emp-1');
    expect(event.referenceName).toBe('Maria dos Santos');
    expect(event.referenceType).toBe('employee');
    expect(event.xmlContent).toBe('<xml>content</xml>');
    expect(event.retryCount).toBe(0);
    expect(event.createdBy).toBe('user-1');
  });

  it('should throw when event is not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, eventId: 'nonexistent' }),
    ).rejects.toThrow('Evento não encontrado.');
  });

  it('should query by both eventId and tenantId', async () => {
    mockFindFirst.mockResolvedValue(makeFullEventRecord());

    await sut.execute({ tenantId: TENANT_ID, eventId: EVENT_ID });

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: EVENT_ID, tenantId: TENANT_ID },
    });
  });

  it('should return ISO date strings for date fields', async () => {
    const periodStart = new Date('2026-03-01T00:00:00.000Z');
    const periodEnd = new Date('2026-03-31T23:59:59.000Z');
    const deadline = new Date('2026-04-15T12:00:00.000Z');
    const createdAt = new Date('2026-02-20T08:00:00.000Z');
    const updatedAt = new Date('2026-02-21T14:30:00.000Z');
    const reviewedAt = new Date('2026-02-22T09:00:00.000Z');
    const approvedAt = new Date('2026-02-23T10:00:00.000Z');

    mockFindFirst.mockResolvedValue(
      makeFullEventRecord({
        periodStart,
        periodEnd,
        deadline,
        createdAt,
        updatedAt,
        reviewedBy: 'user-reviewer',
        reviewedAt,
        approvedBy: 'user-approver',
        approvedAt,
      }),
    );

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
    });

    expect(event.periodStart).toBe('2026-03-01T00:00:00.000Z');
    expect(event.periodEnd).toBe('2026-03-31T23:59:59.000Z');
    expect(event.deadline).toBe('2026-04-15T12:00:00.000Z');
    expect(event.createdAt).toBe('2026-02-20T08:00:00.000Z');
    expect(event.updatedAt).toBe('2026-02-21T14:30:00.000Z');
    expect(event.reviewedAt).toBe('2026-02-22T09:00:00.000Z');
    expect(event.approvedAt).toBe('2026-02-23T10:00:00.000Z');
  });

  it('should return null for nullable date fields when not set', async () => {
    mockFindFirst.mockResolvedValue(
      makeFullEventRecord({
        periodStart: null,
        periodEnd: null,
        deadline: null,
        nextRetryAt: null,
        reviewedAt: null,
        approvedAt: null,
      }),
    );

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
    });

    expect(event.periodStart).toBeNull();
    expect(event.periodEnd).toBeNull();
    expect(event.deadline).toBeNull();
    expect(event.nextRetryAt).toBeNull();
    expect(event.reviewedAt).toBeNull();
    expect(event.approvedAt).toBeNull();
  });

  it('should return rectification and batch info', async () => {
    mockFindFirst.mockResolvedValue(
      makeFullEventRecord({
        rectifiedEventId: 'original-event-1',
        batchId: 'batch-1',
      }),
    );

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
    });

    expect(event.rectifiedEventId).toBe('original-event-1');
    expect(event.batchId).toBe('batch-1');
  });

  it('should return rejection details when event was rejected', async () => {
    mockFindFirst.mockResolvedValue(
      makeFullEventRecord({
        status: 'REJECTED',
        rejectionCode: 'ERR-001',
        rejectionMessage: 'CPF inválido no registro',
        receipt: null,
      }),
    );

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
    });

    expect(event.status).toBe('REJECTED');
    expect(event.rejectionCode).toBe('ERR-001');
    expect(event.rejectionMessage).toBe('CPF inválido no registro');
  });
});
