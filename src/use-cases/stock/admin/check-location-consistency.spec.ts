import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckLocationConsistencyUseCase } from './check-location-consistency';

const TENANT_ID = 'tenant-consistency-1';

let itemsRepository: InMemoryItemsRepository;
let binsRepository: InMemoryBinsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let zonesRepository: InMemoryZonesRepository;
let checkLocationConsistency: CheckLocationConsistencyUseCase;

async function createWarehouseAndZone() {
  const warehouse = await warehousesRepository.create({
    tenantId: TENANT_ID,
    code: 'WH1',
    name: 'Warehouse 1',
  });

  const zone = await zonesRepository.create({
    tenantId: TENANT_ID,
    warehouseId: warehouse.warehouseId,
    code: 'Z1',
    name: 'Zone 1',
  });

  return { warehouse, zone };
}

async function createBin(
  zoneId: UniqueEntityID,
  address: string,
  currentOccupancy = 0,
) {
  return binsRepository.create({
    tenantId: TENANT_ID,
    zoneId,
    address,
    aisle: 1,
    shelf: 1,
    position: 'A',
    currentOccupancy,
  });
}

async function createItem(
  variantId: UniqueEntityID,
  binId?: UniqueEntityID,
  lastKnownAddress?: string,
) {
  const seq = itemsRepository.items.length + 1;
  return itemsRepository.create({
    tenantId: TENANT_ID,
    slug: Slug.createUniqueFromText('test-item', `${seq}`),
    fullCode: `001.001.0001.001-${String(seq).padStart(5, '0')}`,
    sequentialCode: seq,
    barcode: `BARCODE-${seq}`,
    eanCode: `EAN-${seq}`,
    upcCode: `UPC-${seq}`,
    variantId,
    binId,
    lastKnownAddress,
    initialQuantity: 10,
    currentQuantity: 10,
    status: ItemStatus.create('AVAILABLE'),
  });
}

/**
 * Overrides countItemsPerBinForTenant to count items from the in-memory items repository.
 * The default in-memory implementation returns 0 for all bins since it has no reference
 * to the items repository.
 */
function wireCountItemsPerBinForTenant(
  binsRepo: InMemoryBinsRepository,
  itemsRepo: InMemoryItemsRepository,
) {
  binsRepo.countItemsPerBinForTenant = async (tenantId: string) => {
    const map = new Map<string, number>();
    for (const item of itemsRepo.items) {
      if (
        item.binId &&
        !item.deletedAt &&
        item.tenantId.toString() === tenantId
      ) {
        const binIdStr = item.binId.toString();
        map.set(binIdStr, (map.get(binIdStr) ?? 0) + 1);
      }
    }
    return map;
  };
}

describe('CheckLocationConsistencyUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    binsRepository = new InMemoryBinsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    zonesRepository = new InMemoryZonesRepository();

    wireCountItemsPerBinForTenant(binsRepository, itemsRepository);

    checkLocationConsistency = new CheckLocationConsistencyUseCase(
      itemsRepository,
      binsRepository,
    );
  });

  it('should return zero counts when no issues exist', async () => {
    const { zone } = await createWarehouseAndZone();
    const bin = await createBin(zone.zoneId, 'WH1-Z1-A1-S1-P1', 1);
    const variantId = new UniqueEntityID();

    await createItem(variantId, bin.binId);

    const result = await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
    });

    expect(result.orphanedItems).toBe(0);
    expect(result.emptyDeletedBins).toBe(0);
    expect(result.occupancyMismatches).toBe(0);
  });

  it('should detect and fix orphaned items pointing to soft-deleted bins', async () => {
    const { zone } = await createWarehouseAndZone();
    const bin = await createBin(zone.zoneId, 'WH1-Z1-A1-S1-P1', 2);
    const variantId = new UniqueEntityID();

    const orphanedItem1 = await createItem(variantId, bin.binId);
    const orphanedItem2 = await createItem(variantId, bin.binId);

    // Soft-delete the bin
    bin.delete();

    const result = await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
    });

    expect(result.orphanedItems).toBe(2);

    // Verify items were detached and lastKnownAddress was set
    const fixedItem1 = await itemsRepository.findById(
      orphanedItem1.id,
      TENANT_ID,
    );
    expect(fixedItem1?.binId).toBeUndefined();
    expect(fixedItem1?.lastKnownAddress).toBe('WH1-Z1-A1-S1-P1');

    const fixedItem2 = await itemsRepository.findById(
      orphanedItem2.id,
      TENANT_ID,
    );
    expect(fixedItem2?.binId).toBeUndefined();
    expect(fixedItem2?.lastKnownAddress).toBe('WH1-Z1-A1-S1-P1');
  });

  it('should not fix orphaned items when dryRun is true', async () => {
    const { zone } = await createWarehouseAndZone();
    const bin = await createBin(zone.zoneId, 'WH1-Z1-A1-S1-P1', 1);
    const variantId = new UniqueEntityID();

    const orphanedItem = await createItem(variantId, bin.binId);

    // Soft-delete the bin
    bin.delete();

    const result = await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
      dryRun: true,
    });

    expect(result.orphanedItems).toBe(1);

    // Verify item was NOT modified in dry run
    const unchangedItem = await itemsRepository.findById(
      orphanedItem.id,
      TENANT_ID,
    );
    expect(unchangedItem?.binId?.toString()).toBe(bin.binId.toString());
    expect(unchangedItem?.lastKnownAddress).toBeUndefined();
  });

  it('should count empty soft-deleted bins', async () => {
    const { zone } = await createWarehouseAndZone();
    const emptyDeletedBin = await createBin(zone.zoneId, 'WH1-Z1-EMPTY', 0);
    const binWithItems = await createBin(zone.zoneId, 'WH1-Z1-FULL', 1);
    const variantId = new UniqueEntityID();

    await createItem(variantId, binWithItems.binId);

    // Soft-delete both bins
    emptyDeletedBin.delete();
    binWithItems.delete();

    const result = await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
    });

    // emptyDeletedBin has no items, binWithItems had 1 item (now orphaned and detached)
    // After orphaned items are fixed, both deleted bins become empty
    expect(result.emptyDeletedBins).toBe(2);
  });

  it('should detect and fix occupancy mismatches', async () => {
    const { zone } = await createWarehouseAndZone();
    // Bin reports occupancy of 5, but only 2 items are assigned to it
    const mismatchedBin = await createBin(zone.zoneId, 'WH1-Z1-MISMATCH', 5);
    const variantId = new UniqueEntityID();

    await createItem(variantId, mismatchedBin.binId);
    await createItem(variantId, mismatchedBin.binId);

    const result = await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
    });

    expect(result.occupancyMismatches).toBe(1);

    // Verify occupancy was corrected
    const correctedBin = binsRepository.bins.find(
      (b) => b.binId.toString() === mismatchedBin.binId.toString(),
    );
    expect(correctedBin?.currentOccupancy).toBe(2);
  });

  it('should not fix occupancy mismatches when dryRun is true', async () => {
    const { zone } = await createWarehouseAndZone();
    const mismatchedBin = await createBin(zone.zoneId, 'WH1-Z1-MISMATCH', 10);
    const variantId = new UniqueEntityID();

    await createItem(variantId, mismatchedBin.binId);

    const result = await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
      dryRun: true,
    });

    expect(result.occupancyMismatches).toBe(1);

    // Verify occupancy was NOT modified in dry run
    const unchangedBin = binsRepository.bins.find(
      (b) => b.binId.toString() === mismatchedBin.binId.toString(),
    );
    expect(unchangedBin?.currentOccupancy).toBe(10);
  });

  it('should handle all three issues simultaneously', async () => {
    const { zone } = await createWarehouseAndZone();
    const variantId = new UniqueEntityID();

    // Scenario 1: Orphaned item in soft-deleted bin
    const deletedBin = await createBin(zone.zoneId, 'WH1-Z1-DELETED', 1);
    await createItem(variantId, deletedBin.binId);
    deletedBin.delete();

    // Scenario 2: Empty soft-deleted bin (no items)
    const emptyDeletedBin = await createBin(zone.zoneId, 'WH1-Z1-EMPTY-DEL');
    emptyDeletedBin.delete();

    // Scenario 3: Active bin with occupancy mismatch
    const activeBin = await createBin(zone.zoneId, 'WH1-Z1-ACTIVE', 10);
    await createItem(variantId, activeBin.binId);
    await createItem(variantId, activeBin.binId);
    await createItem(variantId, activeBin.binId);

    const result = await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
    });

    expect(result.orphanedItems).toBe(1);
    // After orphan fix, deletedBin becomes empty + emptyDeletedBin was already empty
    expect(result.emptyDeletedBins).toBe(2);
    expect(result.occupancyMismatches).toBe(1);
  });

  it('should isolate checks to the specified tenant', async () => {
    const otherTenantId = 'tenant-other';

    const { zone } = await createWarehouseAndZone();
    const bin = await createBin(zone.zoneId, 'WH1-Z1-A1', 5);
    const variantId = new UniqueEntityID();

    // Items belong to TENANT_ID
    await createItem(variantId, bin.binId);

    // Check consistency for a different tenant - should find nothing
    const result = await checkLocationConsistency.execute({
      tenantId: otherTenantId,
    });

    expect(result.orphanedItems).toBe(0);
    expect(result.emptyDeletedBins).toBe(0);
    expect(result.occupancyMismatches).toBe(0);
  });

  it('should preserve existing lastKnownAddress when bin address is unavailable', async () => {
    const { zone } = await createWarehouseAndZone();
    const bin = await createBin(zone.zoneId, 'WH1-Z1-ORIGINAL', 1);
    const variantId = new UniqueEntityID();

    const itemWithExistingAddress = await createItem(
      variantId,
      bin.binId,
      'previous-address-from-old-bin',
    );

    // Soft-delete the bin
    bin.delete();

    await checkLocationConsistency.execute({
      tenantId: TENANT_ID,
    });

    // The bin address should overwrite the old lastKnownAddress since the bin is known
    const fixedItem = await itemsRepository.findById(
      itemWithExistingAddress.id,
      TENANT_ID,
    );
    expect(fixedItem?.lastKnownAddress).toBe('WH1-Z1-ORIGINAL');
  });
});
