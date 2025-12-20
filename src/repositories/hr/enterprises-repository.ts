import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Enterprise } from '@/entities/hr/enterprise';

export interface CreateEnterpriseSchema {
  legalName: string;
  cnpj: string;
  taxRegime?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  logoUrl?: string;
}

export interface UpdateEnterpriseSchema {
  id: UniqueEntityID;
  legalName?: string;
  taxRegime?: string | null;
  phone?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string;
  logoUrl?: string | null;
}

export interface FindManyEnterprisesParams {
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
}

export interface FindManyEnterprisesResult {
  enterprises: Enterprise[];
  total: number;
}

export interface EnterprisesRepository {
  create(data: CreateEnterpriseSchema): Promise<Enterprise>;
  findById(id: UniqueEntityID): Promise<Enterprise | null>;
  findByCnpj(
    cnpj: string,
    includeDeleted?: boolean,
  ): Promise<Enterprise | null>;
  findMany(
    params: FindManyEnterprisesParams,
  ): Promise<FindManyEnterprisesResult>;
  findManyActive(): Promise<Enterprise[]>;
  findManyInactive(): Promise<Enterprise[]>;
  update(data: UpdateEnterpriseSchema): Promise<Enterprise | null>;
  save(enterprise: Enterprise): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  restore(id: UniqueEntityID): Promise<void>;
}
