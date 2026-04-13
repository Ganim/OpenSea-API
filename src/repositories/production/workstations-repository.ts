import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkstation } from '@/entities/production/workstation';

export interface CreateWorkstationSchema {
  tenantId: string;
  workstationTypeId: string;
  workCenterId?: string;
  code: string;
  name: string;
  description?: string;
  capacityPerDay: number;
  costPerHour?: number;
  setupTimeDefault: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateWorkstationSchema {
  id: UniqueEntityID;
  workstationTypeId?: string;
  workCenterId?: string | null;
  code?: string;
  name?: string;
  description?: string | null;
  capacityPerDay?: number;
  costPerHour?: number | null;
  setupTimeDefault?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface WorkstationsRepository {
  create(data: CreateWorkstationSchema): Promise<ProductionWorkstation>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstation | null>;
  findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionWorkstation | null>;
  findMany(tenantId: string): Promise<ProductionWorkstation[]>;
  findManyByWorkCenter(
    workCenterId: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstation[]>;
  update(data: UpdateWorkstationSchema): Promise<ProductionWorkstation | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
