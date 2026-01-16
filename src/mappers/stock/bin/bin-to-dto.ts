import type { Bin } from '@/entities/stock/bin';

export interface BinDTO {
  id: string;
  zoneId: string;
  address: string;
  aisle: number;
  shelf: number;
  position: string;
  capacity: number | null;
  currentOccupancy: number;
  isActive: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  itemCount?: number;
  occupancyPercentage?: number;
  isAvailable?: boolean;
}

export function binToDTO(bin: Bin, options?: { itemCount?: number }): BinDTO {
  return {
    id: bin.binId.toString(),
    zoneId: bin.zoneId.toString(),
    address: bin.address,
    aisle: bin.aisle,
    shelf: bin.shelf,
    position: bin.position,
    capacity: bin.capacity,
    currentOccupancy: bin.currentOccupancy,
    isActive: bin.isActive,
    isBlocked: bin.isBlocked,
    blockReason: bin.blockReason,
    createdAt: bin.createdAt,
    updatedAt: bin.updatedAt,
    itemCount: options?.itemCount,
    occupancyPercentage: bin.occupancyPercentage,
    isAvailable: bin.isAvailable,
  };
}
