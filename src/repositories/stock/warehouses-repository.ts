import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Warehouse } from '@/entities/stock/warehouse';

export interface CreateWarehouseSchema {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseSchema {
  id: UniqueEntityID;
  code?: string;
  name?: string;
  description?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export interface WarehousesRepository {
  create(data: CreateWarehouseSchema): Promise<Warehouse>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Warehouse | null>;
  findByCode(code: string, tenantId: string): Promise<Warehouse | null>;
  findMany(tenantId: string): Promise<Warehouse[]>;
  findManyActive(tenantId: string): Promise<Warehouse[]>;
  update(data: UpdateWarehouseSchema): Promise<Warehouse | null>;
  save(warehouse: Warehouse): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  countZones(warehouseId: UniqueEntityID): Promise<number>;
}
