import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Company } from '@/entities/hr/company';

export interface CreateCompanySchema {
  tenantId: string;
  legalName: string;
  cnpj: string;
  tradeName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  legalNature?: string;
  taxRegime?: string;
  taxRegimeDetail?: string;
  activityStartDate?: Date;
  status?: string;
  email?: string;
  phoneMain?: string;
  phoneAlt?: string;
  logoUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCompanySchema {
  id: UniqueEntityID;
  legalName?: string;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  legalNature?: string | null;
  taxRegime?: string | null;
  taxRegimeDetail?: string | null;
  activityStartDate?: Date | null;
  status?: string;
  email?: string | null;
  phoneMain?: string | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FindManyCompaniesParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
}

export interface FindManyCompaniesResult {
  companies: Company[];
  total: number;
}

export interface CompaniesRepository {
  create(data: CreateCompanySchema): Promise<Company>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Company | null>;
  findByCnpj(
    cnpj: string,
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<Company | null>;
  findMany(params: FindManyCompaniesParams): Promise<FindManyCompaniesResult>;
  findManyActive(tenantId: string): Promise<Company[]>;
  findManyInactive(tenantId: string): Promise<Company[]>;
  update(data: UpdateCompanySchema): Promise<Company | null>;
  save(company: Company): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  restore(id: UniqueEntityID): Promise<void>;
}
