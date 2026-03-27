import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBlueprintsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  pipelineId?: string;
  search?: string;
}

export interface ProcessBlueprintsRepository {
  create(blueprint: ProcessBlueprint): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProcessBlueprint | null>;
  findByName(name: string, tenantId: string): Promise<ProcessBlueprint | null>;
  findActiveByPipelineId(
    pipelineId: string,
    tenantId: string,
  ): Promise<ProcessBlueprint | null>;
  findManyPaginated(
    params: FindManyBlueprintsPaginatedParams,
  ): Promise<PaginatedResult<ProcessBlueprint>>;
  save(blueprint: ProcessBlueprint): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
