import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceBudget } from '@/entities/finance/finance-budget';
import type { FinanceBudget as PrismaFinanceBudget } from '@prisma/generated/client.js';

export function financeBudgetPrismaToDomain(
  raw: PrismaFinanceBudget,
): FinanceBudget {
  return FinanceBudget.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      categoryId: new UniqueEntityID(raw.categoryId),
      costCenterId: raw.costCenterId
        ? new UniqueEntityID(raw.costCenterId)
        : undefined,
      year: raw.year,
      month: raw.month,
      budgetAmount: Number(raw.budgetAmount),
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}
