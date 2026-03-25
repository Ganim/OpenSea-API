import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { RecurringConfig } from '@/entities/finance/recurring-config';
import type { RecurringConfig as PrismaRecurringConfig } from '@prisma/generated/client.js';

export function recurringConfigPrismaToDomain(
  raw: PrismaRecurringConfig,
): RecurringConfig {
  return RecurringConfig.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      type: raw.type,
      status: raw.status,
      description: raw.description,
      categoryId: new UniqueEntityID(raw.categoryId),
      costCenterId: raw.costCenterId
        ? new UniqueEntityID(raw.costCenterId)
        : undefined,
      bankAccountId: raw.bankAccountId
        ? new UniqueEntityID(raw.bankAccountId)
        : undefined,
      supplierName: raw.supplierName ?? undefined,
      customerName: raw.customerName ?? undefined,
      supplierId: raw.supplierId ?? undefined,
      customerId: raw.customerId ?? undefined,
      expectedAmount: Number(raw.expectedAmount),
      isVariable: raw.isVariable,
      frequencyUnit: raw.frequencyUnit,
      frequencyInterval: raw.frequencyInterval,
      startDate: raw.startDate,
      endDate: raw.endDate ?? undefined,
      totalOccurrences: raw.totalOccurrences ?? undefined,
      generatedCount: raw.generatedCount,
      lastGeneratedDate: raw.lastGeneratedDate ?? undefined,
      nextDueDate: raw.nextDueDate ?? undefined,
      interestRate: raw.interestRate ? Number(raw.interestRate) : undefined,
      penaltyRate: raw.penaltyRate ? Number(raw.penaltyRate) : undefined,
      indexationType: raw.indexationType ?? undefined,
      fixedAdjustmentRate: raw.fixedAdjustmentRate
        ? Number(raw.fixedAdjustmentRate)
        : undefined,
      lastAdjustmentDate: raw.lastAdjustmentDate ?? undefined,
      adjustmentMonth: raw.adjustmentMonth ?? undefined,
      notes: raw.notes ?? undefined,
      createdBy: raw.createdBy ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
