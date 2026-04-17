import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CreateConsortiumSchema } from '@/repositories/finance/consortia-repository';
import { faker } from '@faker-js/faker';

/**
 * P3-25: Factory for CreateConsortiumSchema — feeds
 * `ConsortiaRepository.create()`. Keeps monthlyPayment × totalInstallments
 * loosely correlated with creditValue so the default fixture resembles a
 * real consortium contract.
 */
export function makeConsortium(
  overrides: Partial<CreateConsortiumSchema> = {},
): CreateConsortiumSchema {
  const creditValue =
    overrides.creditValue ??
    faker.number.float({ min: 20_000, max: 300_000, fractionDigits: 2 });

  const totalInstallments =
    overrides.totalInstallments ??
    faker.helpers.arrayElement([48, 60, 72, 84, 120]);

  const monthlyPayment =
    overrides.monthlyPayment ??
    Number(
      (creditValue / totalInstallments + creditValue * 0.002).toFixed(2),
    );

  const startDate = overrides.startDate ?? faker.date.past({ years: 2 });

  return {
    tenantId: overrides.tenantId ?? new UniqueEntityID().toString(),
    bankAccountId:
      overrides.bankAccountId ?? new UniqueEntityID().toString(),
    costCenterId:
      overrides.costCenterId ?? new UniqueEntityID().toString(),
    name: overrides.name ?? `Consórcio ${faker.vehicle.type()}`,
    administrator:
      overrides.administrator ??
      faker.helpers.arrayElement([
        'Bradesco Consórcios',
        'Itaú Consórcios',
        'Porto Seguro Consórcios',
        'Embracon',
      ]),
    groupNumber: overrides.groupNumber ?? faker.string.numeric(4),
    quotaNumber: overrides.quotaNumber ?? faker.string.numeric(3),
    contractNumber:
      overrides.contractNumber ?? faker.finance.accountNumber(10),
    creditValue,
    monthlyPayment,
    totalInstallments,
    paidInstallments: overrides.paidInstallments ?? 0,
    isContemplated: overrides.isContemplated ?? false,
    startDate,
    endDate: overrides.endDate,
    paymentDay:
      overrides.paymentDay ?? faker.number.int({ min: 1, max: 28 }),
    notes: overrides.notes,
    metadata: overrides.metadata ?? {},
  };
}
