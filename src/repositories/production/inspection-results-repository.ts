import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InspectionStatus } from '@/entities/production/inspection-result';
import { ProductionInspectionResult } from '@/entities/production/inspection-result';

export interface CreateInspectionResultSchema {
  inspectionPlanId: string;
  productionOrderId: string;
  inspectedById: string;
  sampleSize: number;
  defectsFound?: number;
  status?: string;
  notes?: string;
}

export interface UpdateInspectionResultSchema {
  id: UniqueEntityID;
  status?: InspectionStatus;
  defectsFound?: number;
  notes?: string | null;
}

export interface InspectionResultsRepository {
  create(
    data: CreateInspectionResultSchema,
  ): Promise<ProductionInspectionResult>;
  findById(id: UniqueEntityID): Promise<ProductionInspectionResult | null>;
  findManyByOrderId(
    productionOrderId: string,
  ): Promise<ProductionInspectionResult[]>;
  update(
    data: UpdateInspectionResultSchema,
  ): Promise<ProductionInspectionResult | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
