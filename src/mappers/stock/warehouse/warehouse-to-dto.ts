import type { Warehouse } from '@/entities/stock/warehouse';

export interface WarehouseStatsDTO {
  totalZones: number;
  totalBins: number;
  occupiedBins: number;
  totalCapacity: number;
  occupancyPercentage: number;
}

export interface WarehouseDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  zoneCount?: number;
  stats?: WarehouseStatsDTO;
}

export function warehouseToDTO(
  warehouse: Warehouse,
  options?: { zoneCount?: number; stats?: WarehouseStatsDTO },
): WarehouseDTO {
  return {
    id: warehouse.warehouseId.toString(),
    code: warehouse.code,
    name: warehouse.name,
    description: warehouse.description,
    address: warehouse.address,
    isActive: warehouse.isActive,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.updatedAt,
    zoneCount: options?.zoneCount,
    stats: options?.stats,
  };
}
