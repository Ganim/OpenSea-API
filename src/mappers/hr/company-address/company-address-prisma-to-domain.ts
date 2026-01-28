import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAddressProps } from '@/entities/hr/company-address';
import type { CompanyAddress as PrismaCompanyAddress } from '@prisma/generated/client.js';

export function mapCompanyAddressPrismaToDomain(
  raw: PrismaCompanyAddress,
): CompanyAddressProps {
  return {
    companyId: new UniqueEntityID(raw.companyId),
    type: raw.type,
    street: raw.street ?? undefined,
    number: raw.number ?? undefined,
    complement: raw.complement ?? undefined,
    district: raw.district ?? undefined,
    city: raw.city ?? undefined,
    state: raw.state ?? undefined,
    zip: raw.zip,
    ibgeCityCode: raw.ibgeCityCode ?? undefined,
    countryCode: raw.countryCode ?? 'BR',
    isPrimary: raw.isPrimary,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    pendingIssues: (raw.pendingIssues as string[] | null) ?? [],
    deletedAt: raw.deletedAt ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
