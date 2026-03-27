import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FlexBenefitAllocation as PrismaFlexBenefitAllocation } from '@prisma/generated/client.js';

export function mapFlexBenefitAllocationPrismaToDomain(
  allocation: PrismaFlexBenefitAllocation,
) {
  return {
    tenantId: new UniqueEntityID(allocation.tenantId),
    employeeId: new UniqueEntityID(allocation.employeeId),
    month: allocation.month,
    year: allocation.year,
    totalBudget: Number(allocation.totalBudget),
    allocations: (allocation.allocations as Record<string, number>) ?? {},
    status: allocation.status,
    confirmedAt: allocation.confirmedAt ?? undefined,
    createdAt: allocation.createdAt,
    updatedAt: allocation.updatedAt,
  };
}
