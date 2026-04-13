import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionInspectionPlan } from '@/entities/production/inspection-plan';

export interface CreateInspectionPlanSchema {
  operationRoutingId: string;
  inspectionType: string;
  description?: string;
  sampleSize: number;
  aqlLevel?: string;
  instructions?: string;
  isActive?: boolean;
}

export interface UpdateInspectionPlanSchema {
  id: UniqueEntityID;
  inspectionType?: string;
  description?: string | null;
  sampleSize?: number;
  aqlLevel?: string | null;
  instructions?: string | null;
  isActive?: boolean;
}

export interface InspectionPlansRepository {
  create(data: CreateInspectionPlanSchema): Promise<ProductionInspectionPlan>;
  findById(id: UniqueEntityID): Promise<ProductionInspectionPlan | null>;
  findManyByOperationRoutingId(
    operationRoutingId: string,
  ): Promise<ProductionInspectionPlan[]>;
  update(
    data: UpdateInspectionPlanSchema,
  ): Promise<ProductionInspectionPlan | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
