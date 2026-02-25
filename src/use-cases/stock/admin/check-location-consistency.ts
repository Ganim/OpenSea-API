import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

export interface CheckLocationConsistencyRequest {
  tenantId: string;
  dryRun?: boolean;
}

export interface CheckLocationConsistencyResponse {
  orphanedItems: number;
  emptyDeletedBins: number;
  occupancyMismatches: number;
}

export class CheckLocationConsistencyUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private binsRepository: BinsRepository,
  ) {}

  async execute(
    request: CheckLocationConsistencyRequest,
  ): Promise<CheckLocationConsistencyResponse> {
    const { tenantId, dryRun = false } = request;

    const orphanedItemsCount = await this.fixOrphanedItems(tenantId, dryRun);
    const emptyDeletedBinsCount = await this.countEmptyDeletedBins(tenantId);
    const occupancyMismatchesCount = await this.fixOccupancyMismatches(
      tenantId,
      dryRun,
    );

    return {
      orphanedItems: orphanedItemsCount,
      emptyDeletedBins: emptyDeletedBinsCount,
      occupancyMismatches: occupancyMismatchesCount,
    };
  }

  /**
   * Find items whose binId references a soft-deleted bin.
   * For each orphaned item:
   * - Preserve the bin's address in lastKnownAddress
   * - Clear the binId (detach from the deleted bin)
   */
  private async fixOrphanedItems(
    tenantId: string,
    dryRun: boolean,
  ): Promise<number> {
    const softDeletedBins =
      await this.binsRepository.findSoftDeletedByTenant(tenantId);

    if (softDeletedBins.length === 0) {
      return 0;
    }

    const deletedBinIds = softDeletedBins.map((bin) => bin.binId.toString());
    const deletedBinAddressMap = new Map<string, string>();
    for (const bin of softDeletedBins) {
      deletedBinAddressMap.set(bin.binId.toString(), bin.address);
    }

    // Find all items in this tenant and filter those pointing to deleted bins
    const allItems = await this.itemsRepository.findAll(tenantId);
    const orphanedItems = allItems.filter(
      (item) => item.binId && deletedBinIds.includes(item.binId.toString()),
    );

    if (dryRun || orphanedItems.length === 0) {
      return orphanedItems.length;
    }

    // Fix each orphaned item: set lastKnownAddress and clear binId
    for (const item of orphanedItems) {
      const binAddress = deletedBinAddressMap.get(item.binId!.toString());
      item.lastKnownAddress = binAddress ?? item.lastKnownAddress;
      item.binId = undefined;
      await this.itemsRepository.save(item);
    }

    return orphanedItems.length;
  }

  /**
   * Count soft-deleted bins that have no items remaining.
   * This is informational only - no action needed since
   * soft-deleted bins with no items are already in a clean state.
   */
  private async countEmptyDeletedBins(tenantId: string): Promise<number> {
    const softDeletedBins =
      await this.binsRepository.findSoftDeletedByTenant(tenantId);

    if (softDeletedBins.length === 0) {
      return 0;
    }

    const allItems = await this.itemsRepository.findAll(tenantId);
    const itemBinIds = new Set(
      allItems
        .filter((item) => item.binId)
        .map((item) => item.binId!.toString()),
    );

    let emptyDeletedBinsCount = 0;
    for (const bin of softDeletedBins) {
      if (!itemBinIds.has(bin.binId.toString())) {
        emptyDeletedBinsCount++;
      }
    }

    return emptyDeletedBinsCount;
  }

  /**
   * For each active bin in the tenant, compare currentOccupancy
   * with the actual count of items assigned to it.
   * If they differ, update currentOccupancy to the actual count.
   */
  private async fixOccupancyMismatches(
    tenantId: string,
    dryRun: boolean,
  ): Promise<number> {
    const activeBins = await this.binsRepository.findMany(tenantId);
    const actualItemCountPerBin =
      await this.binsRepository.countItemsPerBinForTenant(tenantId);

    let mismatchCount = 0;

    for (const bin of activeBins) {
      const actualCount = actualItemCountPerBin.get(bin.binId.toString()) ?? 0;

      if (bin.currentOccupancy !== actualCount) {
        mismatchCount++;

        if (!dryRun) {
          bin.currentOccupancy = actualCount;
          await this.binsRepository.save(bin);
        }
      }
    }

    return mismatchCount;
  }
}
