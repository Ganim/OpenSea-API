import type { CompanyAddress } from '@/entities/hr/company-address';

export interface CompanyAddressDTO {
  id: string;
  companyId: string;
  type: CompanyAddress['type'];
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip: string;
  ibgeCityCode?: string | null;
  countryCode: string;
  isPrimary: boolean;
  metadata: Record<string, unknown>;
  pendingIssues: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export function companyAddressToDTO(
  address: CompanyAddress,
): CompanyAddressDTO {
  return {
    id: address.id.toString(),
    companyId: address.companyId.toString(),
    type: address.type,
    street: address.street ?? null,
    number: address.number ?? null,
    complement: address.complement ?? null,
    district: address.district ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    zip: address.zip,
    ibgeCityCode: address.ibgeCityCode ?? null,
    countryCode: address.countryCode,
    isPrimary: address.isPrimary,
    metadata: address.metadata,
    pendingIssues: address.pendingIssues,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
    deletedAt: address.deletedAt ?? null,
  };
}
