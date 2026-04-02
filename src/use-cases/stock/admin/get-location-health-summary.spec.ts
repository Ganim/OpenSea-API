import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      bin: {
        aggregate: vi.fn(),
        count: vi.fn(),
      },
      item: {
        count: vi.fn(),
      },
      $queryRaw: vi.fn(),
    },
  };
});

import { prisma } from '@/lib/prisma';
import { GetLocationHealthSummaryUseCase } from './get-location-health-summary';

const mockPrisma = vi.mocked(prisma);
const TENANT_ID = 'tenant-1';
let sut: GetLocationHealthSummaryUseCase;

/**
 * Sets up mock responses for all Prisma calls.
 * Uses mockImplementation to handle Promise.all call order ambiguity.
 */
function setupMocks(opts: {
  totalBins?: number;
  usedBins?: number;
  blockedBins?: number;
  orphanedItems?: number;
  expiringItems?: number;
  inconsistencies?: number;
}) {
  const {
    totalBins = 0,
    usedBins = 0,
    blockedBins = 0,
    orphanedItems = 0,
    expiringItems = 0,
    inconsistencies = 0,
  } = opts;

  mockPrisma.bin.aggregate.mockResolvedValue({
    _count: { id: totalBins },
    _sum: { currentOccupancy: 0 },
  } as unknown);

  // bin.count is called twice: once for usedBins (with currentOccupancy gt 0)
  // and once for blockedBins (with isBlocked: true). Use mockImplementation
  // to distinguish them since Promise.all doesn't guarantee order.
  mockPrisma.bin.count.mockImplementation(
    async (args: { where?: Record<string, unknown> }) => {
      if (args?.where?.isBlocked === true) {
        return blockedBins;
      }
      // usedBins (currentOccupancy: { gt: 0 })
      return usedBins;
    },
  );

  // item.count is called twice: orphanedItems (binId: null) and expiringItems (expiryDate filter)
  mockPrisma.item.count.mockImplementation(
    async (args: { where?: Record<string, unknown> }) => {
      if (args?.where?.binId === null) {
        return orphanedItems;
      }
      // expiringItems (has expiryDate filter)
      return expiringItems;
    },
  );

  mockPrisma.$queryRaw.mockResolvedValue(
    inconsistencies > 0 ? [{ count: BigInt(inconsistencies) }] : [],
  );
}

describe('GetLocationHealthSummaryUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetLocationHealthSummaryUseCase();
  });

  it('should return overall occupancy summary', async () => {
    setupMocks({
      totalBins: 100,
      usedBins: 45,
      blockedBins: 3,
      orphanedItems: 5,
      expiringItems: 2,
      inconsistencies: 1,
    });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.overallOccupancy.used).toBe(45);
    expect(result.overallOccupancy.total).toBe(100);
    expect(result.overallOccupancy.percentage).toBe(45);
    expect(result.blockedBins.count).toBe(3);
    expect(result.orphanedItems.count).toBe(5);
    expect(result.expiringItems.count).toBe(2);
    expect(result.expiringItems.thresholdDays).toBe(30);
    expect(result.inconsistencies.count).toBe(1);
  });

  it('should return zero percentage when no bins exist', async () => {
    setupMocks({ totalBins: 0, usedBins: 0 });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.overallOccupancy.percentage).toBe(0);
    expect(result.overallOccupancy.used).toBe(0);
    expect(result.overallOccupancy.total).toBe(0);
  });

  it('should handle all zero counts', async () => {
    setupMocks({ totalBins: 50 });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.overallOccupancy.percentage).toBe(0);
    expect(result.blockedBins.count).toBe(0);
    expect(result.orphanedItems.count).toBe(0);
    expect(result.expiringItems.count).toBe(0);
    expect(result.inconsistencies.count).toBe(0);
  });

  it('should handle missing inconsistency count from raw query', async () => {
    setupMocks({ totalBins: 10, usedBins: 5 });

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.inconsistencies.count).toBe(0);
  });

  it('should calculate percentage with decimal precision', async () => {
    setupMocks({ totalBins: 3, usedBins: 1 });

    const result = await sut.execute({ tenantId: TENANT_ID });

    // 1/3 = 33.333... rounded to 2 decimals = 33.33
    expect(result.overallOccupancy.percentage).toBe(33.33);
  });
});
