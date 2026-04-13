import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDefectTypeSeverity } from '@/entities/production/defect-type';
import { ProductionDefectType } from '@/entities/production/defect-type';

export interface CreateDefectTypeSchema {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  severity: ProductionDefectTypeSeverity;
  isActive?: boolean;
}

export interface UpdateDefectTypeSchema {
  id: UniqueEntityID;
  code?: string;
  name?: string;
  description?: string | null;
  severity?: ProductionDefectTypeSeverity;
  isActive?: boolean;
}

export interface DefectTypesRepository {
  create(data: CreateDefectTypeSchema): Promise<ProductionDefectType>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionDefectType | null>;
  findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionDefectType | null>;
  findMany(tenantId: string): Promise<ProductionDefectType[]>;
  update(data: UpdateDefectTypeSchema): Promise<ProductionDefectType | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
