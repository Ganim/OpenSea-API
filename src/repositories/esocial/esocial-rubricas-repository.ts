import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialRubrica } from '@/entities/esocial/esocial-rubrica';

export interface FindManyEsocialRubricasParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  type?: number;
  isActive?: boolean;
}

export interface FindManyEsocialRubricasResult {
  rubricas: EsocialRubrica[];
  total: number;
}

export interface CreateEsocialRubricaData {
  tenantId: string;
  code: string;
  description: string;
  type: number;
  incidInss?: string;
  incidIrrf?: string;
  incidFgts?: string;
  isActive?: boolean;
}

export interface UpdateEsocialRubricaData {
  description?: string;
  type?: number;
  incidInss?: string | null;
  incidIrrf?: string | null;
  incidFgts?: string | null;
  isActive?: boolean;
}

export interface EsocialRubricasRepository {
  create(data: CreateEsocialRubricaData): Promise<EsocialRubrica>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<EsocialRubrica | null>;
  findByCode(
    code: string,
    tenantId: string,
  ): Promise<EsocialRubrica | null>;
  findMany(
    params: FindManyEsocialRubricasParams,
  ): Promise<FindManyEsocialRubricasResult>;
  update(
    id: UniqueEntityID,
    data: UpdateEsocialRubricaData,
  ): Promise<EsocialRubrica | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
