import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionMaterialIssue } from '@/entities/production/material-issue';

export interface CreateMaterialIssueSchema {
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  batchNumber?: string;
  issuedById: string;
  notes?: string;
}

export interface MaterialIssuesRepository {
  create(data: CreateMaterialIssueSchema): Promise<ProductionMaterialIssue>;
  findById(id: UniqueEntityID): Promise<ProductionMaterialIssue | null>;
  findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialIssue[]>;
}
