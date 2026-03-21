import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Pipeline } from '@/entities/sales/pipeline';

export interface PipelinesRepository {
  create(pipeline: Pipeline): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Pipeline | null>;
  findByName(name: string, tenantId: string): Promise<Pipeline | null>;
  findMany(tenantId: string): Promise<Pipeline[]>;
  save(pipeline: Pipeline): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
