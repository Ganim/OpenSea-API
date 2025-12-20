import type { Enterprise as PrismaEnterprise } from '@prisma/client';
import type { EnterpriseProps } from '@/entities/hr/enterprise';

export function mapEnterprisePrismaToDomain(
  raw: PrismaEnterprise,
): EnterpriseProps {
  return {
    legalName: raw.legalName,
    cnpj: raw.cnpj,
    taxRegime: raw.taxRegime ?? undefined,
    phone: raw.phone ?? undefined,
    address: raw.address ?? undefined,
    addressNumber: raw.addressNumber ?? undefined,
    complement: raw.complement ?? undefined,
    neighborhood: raw.neighborhood ?? undefined,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    zipCode: raw.zipCode ?? undefined,
    country: raw.country,
    logoUrl: raw.logoUrl ?? undefined,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    deletedAt: raw.deletedAt ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
