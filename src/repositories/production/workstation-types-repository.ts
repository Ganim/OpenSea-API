import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkstationType } from '@/entities/production/workstation-type';

export interface CreateWorkstationTypeSchema {
  tenantId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateWorkstationTypeSchema {
  id: UniqueEntityID;
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
}

export interface WorkstationTypesRepository {
  create(data: CreateWorkstationTypeSchema): Promise<ProductionWorkstationType>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkstationType | null>;
  findMany(tenantId: string): Promise<ProductionWorkstationType[]>;
  update(
    data: UpdateWorkstationTypeSchema,
  ): Promise<ProductionWorkstationType | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
