import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CompanyAddress,
  CompanyAddressType,
} from '@/entities/hr/company-address';

export interface CreateCompanyAddressSchema {
  companyId: UniqueEntityID;
  type?: CompanyAddressType;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  zip: string;
  ibgeCityCode?: string;
  countryCode?: string;
  isPrimary?: boolean;
  pendingIssues?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateCompanyAddressSchema {
  id: UniqueEntityID;
  companyId: UniqueEntityID;
  type?: CompanyAddressType;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  ibgeCityCode?: string | null;
  countryCode?: string | null;
  isPrimary?: boolean;
  pendingIssues?: string[];
  metadata?: Record<string, unknown>;
}

export interface FindManyCompanyAddressesParams {
  companyId: UniqueEntityID;
  type?: CompanyAddressType;
  isPrimary?: boolean;
  includeDeleted?: boolean;
  page?: number;
  perPage?: number;
}

export interface FindManyCompanyAddressesResult {
  addresses: CompanyAddress[];
  total: number;
}

export interface CompanyAddressesRepository {
  create(data: CreateCompanyAddressSchema): Promise<CompanyAddress>;
  findById(
    id: UniqueEntityID,
    options?: { companyId?: UniqueEntityID; includeDeleted?: boolean },
  ): Promise<CompanyAddress | null>;
  findByCompanyAndType(
    companyId: UniqueEntityID,
    type: CompanyAddressType,
    options?: { includeDeleted?: boolean },
  ): Promise<CompanyAddress | null>;
  findPrimaryByType(
    companyId: UniqueEntityID,
    type: CompanyAddressType,
  ): Promise<CompanyAddress | null>;
  findMany(
    params: FindManyCompanyAddressesParams,
  ): Promise<FindManyCompanyAddressesResult>;
  save(address: CompanyAddress): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  unsetPrimaryForType(
    companyId: UniqueEntityID,
    type: CompanyAddressType,
    exceptId?: UniqueEntityID,
  ): Promise<void>;
}
