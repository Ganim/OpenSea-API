import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyCnae } from '@/entities/hr/company-cnae';
import type { CompanyCnae as PrismaCompanyCnae } from '@prisma/generated/client.js';

export function mapCompanyCnaePrismaToDomain(raw: PrismaCompanyCnae): Omit<
  CompanyCnae['props'],
  never
> & {
  companyId: UniqueEntityID;
} {
  return {
    companyId: new UniqueEntityID(raw.companyId),
    code: raw.code,
    description: raw.description,
    isPrimary: raw.isPrimary,
    status: raw.status as 'ACTIVE' | 'INACTIVE',
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    pendingIssues: (raw.pendingIssues as string[]) ?? [],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    deletedAt: raw.deletedAt,
  };
}
