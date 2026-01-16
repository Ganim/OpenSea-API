import type { Warehouse } from '@/entities/stock/warehouse';

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
}

export function warehouseToDTO(
  warehouse: Warehouse,
  options?: { zoneCount?: number },
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
  };
}
