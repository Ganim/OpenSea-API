import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionWorkCenter } from '@/entities/production/work-center';

export interface CreateWorkCenterSchema {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWorkCenterSchema {
  id: UniqueEntityID;
  code?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface WorkCentersRepository {
  create(data: CreateWorkCenterSchema): Promise<ProductionWorkCenter>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionWorkCenter | null>;
  findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionWorkCenter | null>;
  findMany(tenantId: string): Promise<ProductionWorkCenter[]>;
  update(data: UpdateWorkCenterSchema): Promise<ProductionWorkCenter | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
