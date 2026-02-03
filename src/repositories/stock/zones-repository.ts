import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Zone } from '@/entities/stock/zone';
import type { ZoneStructureProps } from '@/entities/stock/value-objects/zone-structure';
import type { ZoneLayoutProps } from '@/entities/stock/value-objects/zone-layout';

export interface CreateZoneSchema {
  tenantId: string;
  warehouseId: UniqueEntityID;
  code: string;
  name: string;
  description?: string;
  structure?: ZoneStructureProps;
  layout?: ZoneLayoutProps;
  isActive?: boolean;
}

export interface UpdateZoneSchema {
  id: UniqueEntityID;
  code?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateZoneStructureSchema {
  id: UniqueEntityID;
  structure: ZoneStructureProps;
}

export interface UpdateZoneLayoutSchema {
  id: UniqueEntityID;
  layout: ZoneLayoutProps | null;
}

export interface ZonesRepository {
  create(data: CreateZoneSchema): Promise<Zone>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Zone | null>;
  findByCode(
    warehouseId: UniqueEntityID,
    code: string,
    tenantId: string,
  ): Promise<Zone | null>;
  findMany(tenantId: string): Promise<Zone[]>;
  findManyByWarehouse(
    warehouseId: UniqueEntityID,
    tenantId: string,
  ): Promise<Zone[]>;
  findManyActive(tenantId: string): Promise<Zone[]>;
  findManyActiveByWarehouse(
    warehouseId: UniqueEntityID,
    tenantId: string,
  ): Promise<Zone[]>;
  update(data: UpdateZoneSchema): Promise<Zone | null>;
  updateStructure(data: UpdateZoneStructureSchema): Promise<Zone | null>;
  updateLayout(data: UpdateZoneLayoutSchema): Promise<Zone | null>;
  save(zone: Zone): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  countBins(zoneId: UniqueEntityID): Promise<number>;
}
