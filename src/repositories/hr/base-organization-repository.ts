import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Organization } from '@/entities/hr/organization';

export interface CreateOrganizationSchema {
  tenantId: string;
  legalName: string;
  cnpj?: string | null;
  cpf?: string | null;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: string | null;
  status?: string;
  email?: string;
  phoneMain?: string;
  website?: string | null;
  typeSpecificData?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateOrganizationSchema {
  id: UniqueEntityID;
  legalName?: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: string | null;
  status?: string;
  email?: string | null;
  phoneMain?: string | null;
  website?: string | null;
  typeSpecificData?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
}

export interface FindManyOrganizationsParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
  status?: string;
}

export interface FindManyOrganizationsResult<T extends Organization> {
  organizations: T[];
  total: number;
}

export interface BaseOrganizationRepository<T extends Organization> {
  create(data: CreateOrganizationSchema): Promise<T>;
  findById(id: UniqueEntityID): Promise<T | null>;
  findByCnpj(cnpj: string, includeDeleted?: boolean): Promise<T | null>;
  findByCpf(cpf: string, includeDeleted?: boolean): Promise<T | null>;
  findMany(
    params: FindManyOrganizationsParams,
  ): Promise<FindManyOrganizationsResult<T>>;
  findManyActive(): Promise<T[]>;
  findManyInactive(): Promise<T[]>;
  update(data: UpdateOrganizationSchema): Promise<T | null>;
  save(organization: T): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  restore(id: UniqueEntityID): Promise<void>;
}
