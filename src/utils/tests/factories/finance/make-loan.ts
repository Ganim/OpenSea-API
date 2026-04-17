import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CreateLoanSchema } from '@/repositories/finance/loans-repository';
import { faker } from '@faker-js/faker';

/**
 * P3-25: Factory for CreateLoanSchema — feeds `LoansRepository.create()`.
 * Generates a coherent principalAmount / outstandingBalance pair so the
 * entity invariants (outstandingBalance <= principalAmount) hold by
 * default unless the caller overrides them.
 */
export function makeLoan(
  overrides: Partial<CreateLoanSchema> = {},
): CreateLoanSchema {
  const principalAmount =
    overrides.principalAmount ??
    faker.number.float({ min: 5_000, max: 500_000, fractionDigits: 2 });

  const outstandingBalance =
    overrides.outstandingBalance ??
    faker.number.float({
      min: 0,
      max: principalAmount,
      fractionDigits: 2,
    });

  const startDate = overrides.startDate ?? faker.date.past({ years: 2 });

  return {
    tenantId: overrides.tenantId ?? new UniqueEntityID().toString(),
    bankAccountId: overrides.bankAccountId ?? new UniqueEntityID().toString(),
    costCenterId: overrides.costCenterId ?? new UniqueEntityID().toString(),
    name:
      overrides.name ??
      `${faker.company.name()} - ${faker.finance.accountName()}`,
    type:
      overrides.type ??
      faker.helpers.arrayElement(['CDC', 'FINANCING', 'WORKING_CAPITAL']),
    contractNumber: overrides.contractNumber ?? faker.finance.accountNumber(10),
    principalAmount,
    outstandingBalance,
    interestRate:
      overrides.interestRate ??
      faker.number.float({ min: 0.5, max: 5, fractionDigits: 2 }),
    interestType:
      overrides.interestType ??
      faker.helpers.arrayElement(['FIXED', 'VARIABLE']),
    startDate,
    endDate:
      overrides.endDate ?? faker.date.future({ years: 5, refDate: startDate }),
    totalInstallments:
      overrides.totalInstallments ??
      faker.helpers.arrayElement([12, 24, 36, 48, 60]),
    paidInstallments: overrides.paidInstallments ?? 0,
    installmentDay:
      overrides.installmentDay ?? faker.number.int({ min: 1, max: 28 }),
    notes: overrides.notes,
    metadata: overrides.metadata ?? {},
  };
}
