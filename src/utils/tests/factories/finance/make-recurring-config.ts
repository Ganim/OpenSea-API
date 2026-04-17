import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CreateRecurringConfigSchema } from '@/repositories/finance/recurring-configs-repository';
import { faker } from '@faker-js/faker';

/**
 * P3-25: Factory for CreateRecurringConfigSchema — feeds
 * `RecurringConfigsRepository.create()`. Produces a monthly recurrence
 * with a sensible start/end window unless overridden.
 */
export function makeRecurringConfig(
  overrides: Partial<CreateRecurringConfigSchema> = {},
): CreateRecurringConfigSchema {
  const startDate = overrides.startDate ?? faker.date.recent({ days: 30 });

  return {
    tenantId: overrides.tenantId ?? new UniqueEntityID().toString(),
    type:
      overrides.type ?? faker.helpers.arrayElement(['PAYABLE', 'RECEIVABLE']),
    description:
      overrides.description ?? `Recorrência ${faker.commerce.productName()}`,
    categoryId: overrides.categoryId ?? new UniqueEntityID().toString(),
    costCenterId: overrides.costCenterId,
    bankAccountId: overrides.bankAccountId,
    supplierName: overrides.supplierName,
    customerName: overrides.customerName,
    supplierId: overrides.supplierId,
    customerId: overrides.customerId,
    expectedAmount:
      overrides.expectedAmount ??
      faker.number.float({ min: 100, max: 5_000, fractionDigits: 2 }),
    isVariable: overrides.isVariable ?? false,
    frequencyUnit:
      overrides.frequencyUnit ??
      faker.helpers.arrayElement(['MONTH', 'WEEK', 'DAY', 'YEAR']),
    frequencyInterval: overrides.frequencyInterval ?? 1,
    startDate,
    endDate: overrides.endDate,
    totalOccurrences:
      overrides.totalOccurrences ?? faker.number.int({ min: 6, max: 24 }),
    nextDueDate: overrides.nextDueDate ?? startDate,
    interestRate: overrides.interestRate,
    penaltyRate: overrides.penaltyRate,
    indexationType: overrides.indexationType,
    fixedAdjustmentRate: overrides.fixedAdjustmentRate,
    lastAdjustmentDate: overrides.lastAdjustmentDate,
    adjustmentMonth: overrides.adjustmentMonth,
    notes: overrides.notes,
    createdBy: overrides.createdBy,
  };
}
