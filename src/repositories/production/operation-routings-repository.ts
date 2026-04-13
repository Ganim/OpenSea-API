import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionOperationRouting } from '@/entities/production/operation-routing';

export interface CreateOperationRoutingSchema {
  tenantId: string;
  bomId: string;
  workstationId?: string;
  sequence: number;
  operationName: string;
  description?: string;
  setupTime: number;
  executionTime: number;
  waitTime: number;
  moveTime: number;
  isQualityCheck?: boolean;
  isOptional?: boolean;
  skillRequired?: string;
  instructions?: string;
  imageUrl?: string;
}

export interface UpdateOperationRoutingSchema {
  id: UniqueEntityID;
  bomId?: string;
  workstationId?: string | null;
  sequence?: number;
  operationName?: string;
  description?: string | null;
  setupTime?: number;
  executionTime?: number;
  waitTime?: number;
  moveTime?: number;
  isQualityCheck?: boolean;
  isOptional?: boolean;
  skillRequired?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
}

export interface OperationRoutingsRepository {
  create(
    data: CreateOperationRoutingSchema,
  ): Promise<ProductionOperationRouting>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOperationRouting | null>;
  findMany(tenantId: string): Promise<ProductionOperationRouting[]>;
  findManyByBomId(
    bomId: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOperationRouting[]>;
  update(
    data: UpdateOperationRoutingSchema,
  ): Promise<ProductionOperationRouting | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
