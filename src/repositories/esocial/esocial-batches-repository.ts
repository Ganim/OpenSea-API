import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialBatch } from '@/entities/esocial/esocial-batch';

export interface FindManyEsocialBatchesParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: string;
}

export interface FindManyEsocialBatchesResult {
  batches: EsocialBatch[];
  total: number;
}

export interface CreateEsocialBatchData {
  tenantId: string;
  eventCount: number;
  status?: string;
}

export interface EsocialBatchesRepository {
  create(data: CreateEsocialBatchData): Promise<EsocialBatch>;
  findById(id: UniqueEntityID, tenantId: string): Promise<EsocialBatch | null>;
  findMany(
    params: FindManyEsocialBatchesParams,
  ): Promise<FindManyEsocialBatchesResult>;
  save(batch: EsocialBatch): Promise<void>;
}
