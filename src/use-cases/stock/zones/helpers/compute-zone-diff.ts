import type { Bin } from '@/entities/stock/bin';

interface BinData {
  address: string;
  aisle: number;
  shelf: number;
  position: string;
}

type BinKey = `${number}:${number}:${string}`;

function makeBinKey(aisle: number, shelf: number, position: string): BinKey {
  return `${aisle}:${shelf}:${position}`;
}

export interface ZoneDiffResult {
  toPreserve: Array<{
    existingBin: Bin;
    newAddress: string;
    addressChanged: boolean;
  }>;

  toCreate: BinData[];

  toDelete: Bin[];

  toBlock: Array<{
    bin: Bin;
    itemCount: number;
  }>;
}

export function computeZoneDiff(
  existingBins: Bin[],
  newBinData: BinData[],
  binItemCounts: Map<string, number>,
): ZoneDiffResult {
  const existingMap = new Map<BinKey, Bin>();
  for (const bin of existingBins) {
    existingMap.set(makeBinKey(bin.aisle, bin.shelf, bin.position), bin);
  }

  const newMap = new Map<BinKey, BinData>();
  for (const data of newBinData) {
    newMap.set(makeBinKey(data.aisle, data.shelf, data.position), data);
  }

  const toPreserve: ZoneDiffResult['toPreserve'] = [];
  const toCreate: BinData[] = [];
  const toDelete: Bin[] = [];
  const toBlock: ZoneDiffResult['toBlock'] = [];

  for (const [key, newData] of newMap) {
    const existing = existingMap.get(key);
    if (existing) {
      toPreserve.push({
        existingBin: existing,
        newAddress: newData.address,
        addressChanged: existing.address !== newData.address,
      });
      existingMap.delete(key);
    } else {
      toCreate.push(newData);
    }
  }

  for (const [, existing] of existingMap) {
    const itemCount = binItemCounts.get(existing.binId.toString()) ?? 0;
    if (itemCount > 0) {
      toBlock.push({ bin: existing, itemCount });
    } else {
      toDelete.push(existing);
    }
  }

  return { toPreserve, toCreate, toDelete, toBlock };
}
