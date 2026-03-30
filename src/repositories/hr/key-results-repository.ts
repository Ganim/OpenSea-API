import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KeyResult } from '@/entities/hr/key-result';

export interface CreateKeyResultSchema {
  tenantId: string;
  objectiveId: UniqueEntityID;
  title: string;
  description?: string;
  type: string;
  startValue?: number;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  status?: string;
  weight?: number;
}

export interface UpdateKeyResultSchema {
  id: UniqueEntityID;
  title?: string;
  description?: string;
  type?: string;
  startValue?: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status?: string;
  weight?: number;
}

export interface FindKeyResultFilters {
  objectiveId?: UniqueEntityID;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface KeyResultsRepository {
  create(data: CreateKeyResultSchema): Promise<KeyResult>;
  findById(id: UniqueEntityID, tenantId: string): Promise<KeyResult | null>;
  findByObjective(
    objectiveId: UniqueEntityID,
    tenantId: string,
  ): Promise<KeyResult[]>;
  findMany(
    tenantId: string,
    filters?: FindKeyResultFilters,
  ): Promise<{ keyResults: KeyResult[]; total: number }>;
  update(data: UpdateKeyResultSchema): Promise<KeyResult | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
