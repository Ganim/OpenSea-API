import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const { mockFindFirst, mockUpdate, mockCreate } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialEvent: {
      findFirst: mockFindFirst,
      update: mockUpdate,
      create: mockCreate,
    },
  },
}));

import { UpdateEventStatusUseCase } from './update-event-status';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-status';
const EVENT_ID = 'event-status-1';
const USER_ID = 'user-reviewer-1';

function makeEventRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: EVENT_ID,
    tenantId: TENANT_ID,
    eventType: 'S-2200',
    description: 'Admissão de Trabalhador',
    status: 'DRAFT',
    referenceId: 'emp-1',
    referenceName: 'Carlos Souza',
    referenceType: 'employee',
    periodStart: new Date('2026-01-01'),
    periodEnd: new Date('2026-01-31'),
    deadline: new Date('2026-02-15'),
    xmlContent: '<xml>event</xml>',
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

describe('UpdateEventStatusUseCase', () => {
  let sut: UpdateEventStatusUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new UpdateEventStatusUseCase();
  });

  // ── Valid Transitions ────────────────────────────────────────────────────

  it('should transition DRAFT → REVIEWED on review action', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'DRAFT' }));
    mockUpdate.mockResolvedValue({ id: EVENT_ID, status: 'REVIEWED' });

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'review',
      userId: USER_ID,
    });

    expect(event.status).toBe('REVIEWED');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: EVENT_ID },
      data: expect.objectContaining({
        status: 'REVIEWED',
        reviewedBy: USER_ID,
        reviewedAt: expect.any(Date),
      }),
    });
  });

  it('should transition DRAFT → APPROVED on approve action', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'DRAFT' }));
    mockUpdate.mockResolvedValue({ id: EVENT_ID, status: 'APPROVED' });

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'approve',
      userId: USER_ID,
    });

    expect(event.status).toBe('APPROVED');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: EVENT_ID },
      data: expect.objectContaining({
        status: 'APPROVED',
        approvedBy: USER_ID,
        approvedAt: expect.any(Date),
      }),
    });
  });

  it('should transition REVIEWED → APPROVED on approve action', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'REVIEWED' }));
    mockUpdate.mockResolvedValue({ id: EVENT_ID, status: 'APPROVED' });

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'approve',
      userId: USER_ID,
    });

    expect(event.status).toBe('APPROVED');
  });

  it('should transition REVIEWED → DRAFT on reject action', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'REVIEWED' }));
    mockUpdate.mockResolvedValue({ id: EVENT_ID, status: 'DRAFT' });

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'reject',
      userId: USER_ID,
      rejectionReason: 'CPF incorreto no registro.',
    });

    expect(event.status).toBe('DRAFT');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: EVENT_ID },
      data: expect.objectContaining({
        status: 'DRAFT',
        rejectionMessage: 'CPF incorreto no registro.',
      }),
    });
  });

  it('should transition APPROVED → DRAFT on reject action', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'APPROVED' }));
    mockUpdate.mockResolvedValue({ id: EVENT_ID, status: 'DRAFT' });

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'reject',
      userId: USER_ID,
    });

    expect(event.status).toBe('DRAFT');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: EVENT_ID },
      data: expect.objectContaining({
        rejectionMessage: null,
      }),
    });
  });

  // ── Rectification ────────────────────────────────────────────────────────

  it('should create a new DRAFT event on rectify from REJECTED status', async () => {
    const originalEvent = makeEventRecord({
      status: 'REJECTED',
      description: 'Admissão de Trabalhador',
    });
    mockFindFirst.mockResolvedValue(originalEvent);
    mockCreate.mockResolvedValue({
      id: 'rectified-event-1',
      status: 'DRAFT',
    });

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'rectify',
      userId: USER_ID,
    });

    expect(event.id).toBe('rectified-event-1');
    expect(event.status).toBe('DRAFT');
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: TENANT_ID,
        eventType: 'S-2200',
        description: '[Retificação] Admissão de Trabalhador',
        status: 'DRAFT',
        rectifiedEventId: EVENT_ID,
        createdBy: USER_ID,
      }),
    });
    // Should NOT call update for rectify
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should create a new DRAFT event on rectify from ACCEPTED status', async () => {
    const acceptedEvent = makeEventRecord({
      status: 'ACCEPTED',
      receipt: 'REC-12345',
    });
    mockFindFirst.mockResolvedValue(acceptedEvent);
    mockCreate.mockResolvedValue({
      id: 'rectified-event-2',
      status: 'DRAFT',
    });

    const { event } = await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'rectify',
      userId: USER_ID,
    });

    expect(event.id).toBe('rectified-event-2');
    expect(event.status).toBe('DRAFT');
  });

  it('should preserve reference data in rectified event', async () => {
    const originalEvent = makeEventRecord({
      status: 'REJECTED',
      referenceId: 'emp-42',
      referenceName: 'Ana Pereira',
      referenceType: 'employee',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-31'),
      deadline: new Date('2026-04-15'),
      xmlContent: '<xml>original</xml>',
    });
    mockFindFirst.mockResolvedValue(originalEvent);
    mockCreate.mockResolvedValue({ id: 'rect-3', status: 'DRAFT' });

    await sut.execute({
      tenantId: TENANT_ID,
      eventId: EVENT_ID,
      action: 'rectify',
      userId: USER_ID,
    });

    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        referenceId: 'emp-42',
        referenceName: 'Ana Pereira',
        referenceType: 'employee',
        periodStart: new Date('2026-03-01'),
        periodEnd: new Date('2026-03-31'),
        deadline: new Date('2026-04-15'),
        xmlContent: '<xml>original</xml>',
      }),
    });
  });

  // ── Invalid Transitions ──────────────────────────────────────────────────

  it('should throw when event is not found', async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        eventId: 'nonexistent',
        action: 'review',
        userId: USER_ID,
      }),
    ).rejects.toThrow('Evento não encontrado.');
  });

  it('should throw when trying to reject a DRAFT event', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'DRAFT' }));

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        eventId: EVENT_ID,
        action: 'reject',
        userId: USER_ID,
      }),
    ).rejects.toThrow(
      'Ação "reject" não é permitida para eventos com status "DRAFT".',
    );
  });

  it('should throw when trying to review a REVIEWED event', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'REVIEWED' }));

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        eventId: EVENT_ID,
        action: 'review',
        userId: USER_ID,
      }),
    ).rejects.toThrow(
      'Ação "review" não é permitida para eventos com status "REVIEWED".',
    );
  });

  it('should throw when trying to approve an ACCEPTED event', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'ACCEPTED' }));

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        eventId: EVENT_ID,
        action: 'approve',
        userId: USER_ID,
      }),
    ).rejects.toThrow(
      'Ação "approve" não é permitida para eventos com status "ACCEPTED".',
    );
  });

  it('should throw when trying to rectify a DRAFT event', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'DRAFT' }));

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        eventId: EVENT_ID,
        action: 'rectify',
        userId: USER_ID,
      }),
    ).rejects.toThrow(
      'Ação "rectify" não é permitida para eventos com status "DRAFT".',
    );
  });

  it('should throw when status has no known transitions (e.g. TRANSMITTING)', async () => {
    mockFindFirst.mockResolvedValue(
      makeEventRecord({ status: 'TRANSMITTING' }),
    );

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        eventId: EVENT_ID,
        action: 'review',
        userId: USER_ID,
      }),
    ).rejects.toThrow('Status TRANSMITTING não permite transições.');
  });

  it('should throw when status has no known transitions (ERROR)', async () => {
    mockFindFirst.mockResolvedValue(makeEventRecord({ status: 'ERROR' }));

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        eventId: EVENT_ID,
        action: 'approve',
        userId: USER_ID,
      }),
    ).rejects.toThrow('Status ERROR não permite transições.');
  });
});
