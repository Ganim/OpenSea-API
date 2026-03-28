import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma & CertificateManager ────────────────────────────────────────

const {
  mockGroupBy,
  mockEventCount,
  mockCertFindUnique,
  mockBatchFindFirst,
  mockEventFindMany,
} = vi.hoisted(() => ({
  mockGroupBy: vi.fn(),
  mockEventCount: vi.fn(),
  mockCertFindUnique: vi.fn(),
  mockBatchFindFirst: vi.fn(),
  mockEventFindMany: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialEvent: {
      groupBy: mockGroupBy,
      count: mockEventCount,
      findMany: mockEventFindMany,
    },
    esocialCertificate: {
      findUnique: mockCertFindUnique,
    },
    esocialBatch: {
      findFirst: mockBatchFindFirst,
    },
  },
}));

// Mock the CertificateManager methods used in the dashboard
const mockDaysUntilExpiry = vi.fn();
const mockIsExpired = vi.fn();

vi.mock('@/services/esocial/crypto/certificate-manager', () => ({
  CertificateManager: vi.fn().mockImplementation(() => ({
    daysUntilExpiry: mockDaysUntilExpiry,
    isExpired: mockIsExpired,
  })),
}));

import { GetEsocialDashboardUseCase } from './get-esocial-dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-dashboard';

function setupDefaultMocks() {
  // Default: no events
  mockGroupBy.mockResolvedValue([]);
  mockEventCount.mockResolvedValue(0);
  mockCertFindUnique.mockResolvedValue(null);
  mockBatchFindFirst.mockResolvedValue(null);
  mockEventFindMany.mockResolvedValue([]);
  mockDaysUntilExpiry.mockReturnValue(0);
  mockIsExpired.mockReturnValue(true);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GetEsocialDashboardUseCase', () => {
  let sut: GetEsocialDashboardUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetEsocialDashboardUseCase();
    setupDefaultMocks();
  });

  it('should return zero counts when no events exist', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalEvents).toBe(0);
    expect(result.byStatus).toEqual({
      DRAFT: 0,
      REVIEWED: 0,
      APPROVED: 0,
      TRANSMITTING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      ERROR: 0,
    });
    expect(result.pendingDeadlines).toBe(0);
    expect(result.lastTransmission).toBeNull();
    expect(result.rejectedEvents).toEqual([]);
  });

  it('should aggregate event counts by status', async () => {
    mockGroupBy.mockResolvedValue([
      { status: 'DRAFT', _count: { id: 5 } },
      { status: 'REVIEWED', _count: { id: 3 } },
      { status: 'APPROVED', _count: { id: 2 } },
      { status: 'ACCEPTED', _count: { id: 10 } },
      { status: 'REJECTED', _count: { id: 1 } },
    ]);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.totalEvents).toBe(21);
    expect(result.byStatus.DRAFT).toBe(5);
    expect(result.byStatus.REVIEWED).toBe(3);
    expect(result.byStatus.APPROVED).toBe(2);
    expect(result.byStatus.ACCEPTED).toBe(10);
    expect(result.byStatus.REJECTED).toBe(1);
    expect(result.byStatus.TRANSMITTING).toBe(0);
    expect(result.byStatus.ERROR).toBe(0);
  });

  it('should count pending deadlines', async () => {
    mockEventCount.mockResolvedValue(4);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.pendingDeadlines).toBe(4);
    expect(mockEventCount).toHaveBeenCalledWith({
      where: {
        tenantId: TENANT_ID,
        status: { in: ['DRAFT', 'REVIEWED', 'APPROVED'] },
        deadline: { lte: expect.any(Date) },
      },
    });
  });

  it('should return certificate expiry info when certificate exists', async () => {
    const validUntil = new Date('2027-06-15T00:00:00.000Z');
    mockCertFindUnique.mockResolvedValue({
      id: 'cert-1',
      tenantId: TENANT_ID,
      validUntil,
    });
    mockDaysUntilExpiry.mockReturnValue(445);
    mockIsExpired.mockReturnValue(false);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.certificateExpiry.hasCertificate).toBe(true);
    expect(result.certificateExpiry.daysLeft).toBe(445);
    expect(result.certificateExpiry.isExpired).toBe(false);
    expect(result.certificateExpiry.validUntil).toBe(
      '2027-06-15T00:00:00.000Z',
    );
  });

  it('should return no-certificate info when no certificate exists', async () => {
    mockCertFindUnique.mockResolvedValue(null);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.certificateExpiry.hasCertificate).toBe(false);
    expect(result.certificateExpiry.daysLeft).toBe(0);
    expect(result.certificateExpiry.isExpired).toBe(true);
    expect(result.certificateExpiry.validUntil).toBeNull();
  });

  it('should return expired certificate info', async () => {
    const validUntil = new Date('2025-01-01T00:00:00.000Z');
    mockCertFindUnique.mockResolvedValue({
      id: 'cert-expired',
      tenantId: TENANT_ID,
      validUntil,
    });
    mockDaysUntilExpiry.mockReturnValue(-365);
    mockIsExpired.mockReturnValue(true);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.certificateExpiry.hasCertificate).toBe(true);
    expect(result.certificateExpiry.isExpired).toBe(true);
    expect(result.certificateExpiry.daysLeft).toBe(-365);
  });

  it('should return last transmission date', async () => {
    const transmittedAt = new Date('2026-03-20T14:30:00.000Z');
    mockBatchFindFirst.mockResolvedValue({ transmittedAt });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.lastTransmission).toBe('2026-03-20T14:30:00.000Z');
  });

  it('should return null for last transmission when no batches transmitted', async () => {
    mockBatchFindFirst.mockResolvedValue(null);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.lastTransmission).toBeNull();
  });

  it('should return up to 10 recent rejected events', async () => {
    const rejectedEvents = Array.from({ length: 3 }, (_, idx) => ({
      id: `rejected-${idx}`,
      eventType: 'S-2200',
      referenceName: `Employee ${idx}`,
      rejectionCode: `ERR-${idx}`,
      rejectionMessage: `Error ${idx}`,
      createdAt: new Date(`2026-03-${15 + idx}T10:00:00.000Z`),
    }));
    mockEventFindMany.mockResolvedValue(rejectedEvents);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.rejectedEvents).toHaveLength(3);
    expect(result.rejectedEvents[0].id).toBe('rejected-0');
    expect(result.rejectedEvents[0].createdAt).toBe('2026-03-15T10:00:00.000Z');
    expect(result.rejectedEvents[0].rejectionCode).toBe('ERR-0');
  });

  it('should query rejected events with correct params', async () => {
    mockEventFindMany.mockResolvedValue([]);

    await sut.execute({ tenantId: TENANT_ID });

    expect(mockEventFindMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, status: 'REJECTED' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        referenceName: true,
        rejectionCode: true,
        rejectionMessage: true,
        createdAt: true,
      },
    });
  });

  it('should query groupBy with correct tenant filter', async () => {
    await sut.execute({ tenantId: TENANT_ID });

    expect(mockGroupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: { tenantId: TENANT_ID },
      _count: { id: true },
    });
  });
});
