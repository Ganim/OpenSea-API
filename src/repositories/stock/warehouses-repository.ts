import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Warehouse } from '@/entities/stock/warehouse';

export interface CreateWarehouseSchema {
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
  findById(id: UniqueEntityID): Promise<Warehouse | null>;
  findByCode(code: string): Promise<Warehouse | null>;
  findMany(): Promise<Warehouse[]>;
  findManyActive(): Promise<Warehouse[]>;
  update(data: UpdateWarehouseSchema): Promise<Warehouse | null>;
  save(warehouse: Warehouse): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  countZones(warehouseId: UniqueEntityID): Promise<number>;
}
