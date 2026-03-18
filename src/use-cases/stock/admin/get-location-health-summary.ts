import { prisma } from '@/lib/prisma';

export interface GetLocationHealthSummaryRequest {
  tenantId: string;
}

export interface OccupancySummary {
  used: number;
  total: number;
  percentage: number;
}

export interface GetLocationHealthSummaryResponse {
  overallOccupancy: OccupancySummary;
  blockedBins: { count: number };
  orphanedItems: { count: number };
  expiringItems: { count: number; thresholdDays: number };
  inconsistencies: { count: number };
}

const EXPIRY_THRESHOLD_DAYS = 30;

export class GetLocationHealthSummaryUseCase {
  async execute(
    request: GetLocationHealthSummaryRequest,
  ): Promise<GetLocationHealthSummaryResponse> {
    const { tenantId } = request;

    const [
      binAggregation,
      blockedBinCount,
      orphanedItemCount,
      expiringItemCount,
      inconsistencyCount,
    ] = await Promise.all([
      this.getOccupancyAggregation(tenantId),
      this.countBlockedBins(tenantId),
      this.countOrphanedItems(tenantId),
      this.countExpiringItems(tenantId),
      this.countOccupancyInconsistencies(tenantId),
    ]);

    const occupancyPercentage =
      binAggregation.total > 0
        ? Math.round((binAggregation.used / binAggregation.total) * 100 * 100) /
          100
        : 0;

    return {
      overallOccupancy: {
        used: binAggregation.used,
        total: binAggregation.total,
        percentage: occupancyPercentage,
      },
      blockedBins: { count: blockedBinCount },
      orphanedItems: { count: orphanedItemCount },
      expiringItems: {
        count: expiringItemCount,
        thresholdDays: EXPIRY_THRESHOLD_DAYS,
      },
      inconsistencies: { count: inconsistencyCount },
    };
  }

  private async getOccupancyAggregation(
    tenantId: string,
  ): Promise<{ used: number; total: number }> {
    const result = await prisma.bin.aggregate({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
      },
      _count: { id: true },
      _sum: { currentOccupancy: true },
    });

    const total = result._count.id;
    const usedBins = await prisma.bin.count({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        currentOccupancy: { gt: 0 },
      },
    });

    return { used: usedBins, total };
  }

  private async countBlockedBins(tenantId: string): Promise<number> {
    return prisma.bin.count({
      where: {
        tenantId,
        deletedAt: null,
        isBlocked: true,
      },
    });
  }

  private async countOrphanedItems(tenantId: string): Promise<number> {
    return prisma.item.count({
      where: {
        tenantId,
        deletedAt: null,
        binId: null,
      },
    });
  }

  private async countExpiringItems(tenantId: string): Promise<number> {
    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setDate(thresholdDate.getDate() + EXPIRY_THRESHOLD_DAYS);

    return prisma.item.count({
      where: {
        tenantId,
        deletedAt: null,
        expiryDate: {
          not: null,
          gt: now,
          lte: thresholdDate,
        },
      },
    });
  }

  private async countOccupancyInconsistencies(
    tenantId: string,
  ): Promise<number> {
    // Use a raw query to compare currentOccupancy with the actual item count per bin
    const inconsistencies = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM bins b
      WHERE b.tenant_id = ${tenantId}
        AND b.deleted_at IS NULL
        AND b.is_active = true
        AND b.current_occupancy != (
          SELECT COUNT(*)
          FROM items i
          WHERE i.bin_id = b.id
            AND i.deleted_at IS NULL
        )
    `;

    return Number(inconsistencies[0]?.count ?? 0);
  }
}
