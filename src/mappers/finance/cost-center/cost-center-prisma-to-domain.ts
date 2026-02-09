import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CostCenter } from '@/entities/finance/cost-center';
import type { CostCenter as PrismaCostCenter } from '@prisma/generated/client.js';

export function mapCostCenterPrismaToDomain(data: PrismaCostCenter) {
  return {
    id: new UniqueEntityID(data.id),
    tenantId: new UniqueEntityID(data.tenantId),
    companyId: data.companyId ? new UniqueEntityID(data.companyId) : undefined,
    code: data.code,
    name: data.name,
    description: data.description ?? undefined,
    isActive: data.isActive,
    monthlyBudget: data.monthlyBudget ? Number(data.monthlyBudget.toString()) : undefined,
    annualBudget: data.annualBudget ? Number(data.annualBudget.toString()) : undefined,
    parentId: data.parentId ? new UniqueEntityID(data.parentId) : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt ?? undefined,
  };
}

export function costCenterPrismaToDomain(data: PrismaCostCenter): CostCenter {
  return CostCenter.create(
    mapCostCenterPrismaToDomain(data),
    new UniqueEntityID(data.id),
  );
}
