import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ChartOfAccount } from '@/entities/finance/chart-of-account';
import type { ChartOfAccount as PrismaChartOfAccount } from '@prisma/generated/client.js';

export function mapChartOfAccountPrismaToDomain(data: PrismaChartOfAccount) {
  return {
    id: new UniqueEntityID(data.id),
    tenantId: new UniqueEntityID(data.tenantId),
    code: data.code,
    name: data.name,
    type: data.type,
    accountClass: data.class,
    nature: data.nature,
    parentId: data.parentId ? new UniqueEntityID(data.parentId) : undefined,
    isActive: data.isActive,
    isSystem: data.isSystem,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt ?? undefined,
  };
}

export function chartOfAccountPrismaToDomain(
  data: PrismaChartOfAccount,
): ChartOfAccount {
  return ChartOfAccount.create(
    mapChartOfAccountPrismaToDomain(data),
    new UniqueEntityID(data.id),
  );
}
