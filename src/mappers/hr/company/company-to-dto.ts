import type { Company, TaxRegime } from '@/entities/hr/company';
import type { Department } from '@/entities/hr/department';
import {
  departmentToDTO,
  type DepartmentDTO,
} from '../department/department-to-dto';

export interface CompanyDTO {
  id: string;
  legalName: string;
  cnpj: string;
  tradeName?: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  legalNature?: string;
  taxRegime?: TaxRegime;
  taxRegimeDetail?: string;
  activityStartDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  email?: string;
  phoneMain?: string;
  phoneAlt?: string;
  logoUrl?: string;
  metadata?: Record<string, unknown>;
  pendingIssues?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CompanyWithDetailsDTO extends CompanyDTO {
  departments?: DepartmentDTO[];
  departmentsCount: number;
}

export function companyToDTO(company: Company): CompanyDTO {
  return {
    id: company.id.toString(),
    legalName: company.legalName,
    cnpj: company.cnpj,
    tradeName: company.tradeName ?? undefined,
    stateRegistration: company.stateRegistration ?? undefined,
    municipalRegistration: company.municipalRegistration ?? undefined,
    legalNature: company.legalNature ?? undefined,
    taxRegime: company.taxRegime ?? undefined,
    taxRegimeDetail: company.taxRegimeDetail ?? undefined,
    activityStartDate: company.activityStartDate
      ? company.activityStartDate.toISOString()
      : undefined,
    status: company.status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    email: company.email ?? undefined,
    phoneMain: company.phoneMain ?? undefined,
    phoneAlt: company.phoneAlt ?? undefined,
    logoUrl: company.logoUrl ?? undefined,
    metadata: company.metadata,
    pendingIssues: company.pendingIssues,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    deletedAt: company.deletedAt ? company.deletedAt.toISOString() : undefined,
  };
}

export function companyToDetailsDTO(data: {
  company: Company;
  departments?: Department[];
}): CompanyWithDetailsDTO {
  const { company, departments } = data;

  return {
    ...companyToDTO(company),
    departments: departments?.map(departmentToDTO),
    departmentsCount: departments?.length ?? 0,
  };
}
