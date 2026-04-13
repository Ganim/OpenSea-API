import type { ProductionOperationRouting } from '@/entities/production/operation-routing';

export interface OperationRoutingDTO {
  id: string;
  bomId: string;
  workstationId: string | null;
  sequence: number;
  operationName: string;
  description: string | null;
  setupTime: number;
  executionTime: number;
  waitTime: number;
  moveTime: number;
  isQualityCheck: boolean;
  isOptional: boolean;
  skillRequired: string | null;
  instructions: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function operationRoutingToDTO(
  entity: ProductionOperationRouting,
): OperationRoutingDTO {
  return {
    id: entity.operationRoutingId.toString(),
    bomId: entity.bomId.toString(),
    workstationId: entity.workstationId?.toString() ?? null,
    sequence: entity.sequence,
    operationName: entity.operationName,
    description: entity.description,
    setupTime: entity.setupTime,
    executionTime: entity.executionTime,
    waitTime: entity.waitTime,
    moveTime: entity.moveTime,
    isQualityCheck: entity.isQualityCheck,
    isOptional: entity.isOptional,
    skillRequired: entity.skillRequired,
    instructions: entity.instructions,
    imageUrl: entity.imageUrl,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}
