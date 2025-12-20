import type { Enterprise } from '@/entities/hr/enterprise';

export interface EnterpriseDTO {
  id: string;
  legalName: string;
  cnpj: string;
  taxRegime?: string | null;
  phone?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country: string;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export function enterpriseToDTO(enterprise: Enterprise): EnterpriseDTO {
  return {
    id: enterprise.id.toString(),
    legalName: enterprise.legalName,
    cnpj: enterprise.cnpj,
    taxRegime: enterprise.taxRegime ?? null,
    phone: enterprise.phone ?? null,
    address: enterprise.address ?? null,
    addressNumber: enterprise.addressNumber ?? null,
    complement: enterprise.complement ?? null,
    neighborhood: enterprise.neighborhood ?? null,
    city: enterprise.city ?? null,
    state: enterprise.state ?? null,
    zipCode: enterprise.zipCode ?? null,
    country: enterprise.country,
    logoUrl: enterprise.logoUrl ?? null,
    createdAt: enterprise.createdAt,
    updatedAt: enterprise.updatedAt,
    deletedAt: enterprise.deletedAt ?? null,
  };
}
