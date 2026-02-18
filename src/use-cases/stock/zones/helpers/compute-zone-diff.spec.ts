import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bin } from '@/entities/stock/bin';
import { describe, expect, it } from 'vitest';
import { computeZoneDiff } from './compute-zone-diff';

function makeBin(overrides: {
  aisle: number;
  shelf: number;
  position: string;
  address: string;
}): Bin {
  return Bin.create({
    tenantId: new UniqueEntityID('t1'),
    zoneId: new UniqueEntityID('z1'),
    address: overrides.address,
    aisle: overrides.aisle,
    shelf: overrides.shelf,
    position: overrides.position,
    capacity: null,
    currentOccupancy: 0,
    isActive: true,
    isBlocked: false,
    blockReason: null,
  });
}

describe('computeZoneDiff', () => {
  it('should identify bins to preserve when they match by position', () => {
    const existingBins = [
      makeBin({ aisle: 1, shelf: 1, position: 'A', address: 'WH-ZN-01-01-A' }),
      makeBin({ aisle: 1, shelf: 1, position: 'B', address: 'WH-ZN-01-01-B' }),
    ];

    const newBinData = [
      { address: 'WH-ZN-01-01-A', aisle: 1, shelf: 1, position: 'A' },
      { address: 'WH-ZN-01-01-B', aisle: 1, shelf: 1, position: 'B' },
    ];

    const binItemCounts = new Map<string, number>();

    const result = computeZoneDiff(existingBins, newBinData, binItemCounts);

    expect(result.toPreserve).toHaveLength(2);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toDelete).toHaveLength(0);
    expect(result.toBlock).toHaveLength(0);
  });

  it('should identify new bins to create', () => {
    const existingBins = [
      makeBin({ aisle: 1, shelf: 1, position: 'A', address: 'WH-ZN-01-01-A' }),
    ];

    const newBinData = [
      { address: 'WH-ZN-01-01-A', aisle: 1, shelf: 1, position: 'A' },
      { address: 'WH-ZN-01-01-B', aisle: 1, shelf: 1, position: 'B' },
      { address: 'WH-ZN-01-02-A', aisle: 1, shelf: 2, position: 'A' },
    ];

    const binItemCounts = new Map<string, number>();

    const result = computeZoneDiff(existingBins, newBinData, binItemCounts);

    expect(result.toPreserve).toHaveLength(1);
    expect(result.toCreate).toHaveLength(2);
    expect(result.toDelete).toHaveLength(0);
    expect(result.toBlock).toHaveLength(0);
  });

  it('should identify empty bins to delete', () => {
    const binToDelete = makeBin({
      aisle: 1,
      shelf: 2,
      position: 'A',
      address: 'WH-ZN-01-02-A',
    });

    const existingBins = [
      makeBin({ aisle: 1, shelf: 1, position: 'A', address: 'WH-ZN-01-01-A' }),
      binToDelete,
    ];

    const newBinData = [
      { address: 'WH-ZN-01-01-A', aisle: 1, shelf: 1, position: 'A' },
    ];

    // No items in any bin
    const binItemCounts = new Map<string, number>();
    binItemCounts.set(binToDelete.binId.toString(), 0);

    const result = computeZoneDiff(existingBins, newBinData, binItemCounts);

    expect(result.toPreserve).toHaveLength(1);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toDelete).toHaveLength(1);
    expect(result.toDelete[0].binId.equals(binToDelete.binId)).toBe(true);
    expect(result.toBlock).toHaveLength(0);
  });

  it('should block bins with items instead of deleting', () => {
    const binWithItems = makeBin({
      aisle: 1,
      shelf: 2,
      position: 'A',
      address: 'WH-ZN-01-02-A',
    });

    const existingBins = [
      makeBin({ aisle: 1, shelf: 1, position: 'A', address: 'WH-ZN-01-01-A' }),
      binWithItems,
    ];

    const newBinData = [
      { address: 'WH-ZN-01-01-A', aisle: 1, shelf: 1, position: 'A' },
    ];

    // Bin has 5 items
    const binItemCounts = new Map<string, number>();
    binItemCounts.set(binWithItems.binId.toString(), 5);

    const result = computeZoneDiff(existingBins, newBinData, binItemCounts);

    expect(result.toPreserve).toHaveLength(1);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toDelete).toHaveLength(0);
    expect(result.toBlock).toHaveLength(1);
    expect(result.toBlock[0].bin.binId.equals(binWithItems.binId)).toBe(true);
    expect(result.toBlock[0].itemCount).toBe(5);
  });

  it('should detect address changes in preserved bins', () => {
    const existingBins = [
      makeBin({ aisle: 1, shelf: 1, position: 'A', address: 'OLD-ZN-01-01-A' }),
    ];

    const newBinData = [
      { address: 'NEW-ZN-01-01-A', aisle: 1, shelf: 1, position: 'A' },
    ];

    const binItemCounts = new Map<string, number>();

    const result = computeZoneDiff(existingBins, newBinData, binItemCounts);

    expect(result.toPreserve).toHaveLength(1);
    expect(result.toPreserve[0].addressChanged).toBe(true);
    expect(result.toPreserve[0].newAddress).toBe('NEW-ZN-01-01-A');
  });

  it('should handle empty inputs', () => {
    const result = computeZoneDiff([], [], new Map<string, number>());

    expect(result.toPreserve).toHaveLength(0);
    expect(result.toCreate).toHaveLength(0);
    expect(result.toDelete).toHaveLength(0);
    expect(result.toBlock).toHaveLength(0);
  });
});
