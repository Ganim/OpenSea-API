import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CreateFinanceEntrySchema } from '@/repositories/finance/finance-entries-repository';
import { faker } from '@faker-js/faker';

/**
 * P3-25: Factory for CreateFinanceEntrySchema — the shape that feeds
 * `FinanceEntriesRepository.create()`. Generates realistic defaults so
 * specs can focus on the fields that matter for the scenario under test.
 *
 * Callers may override any field; unspecified fields receive faker-
 * generated plausible values.
 */
export function makeFinanceEntry(
  overrides: Partial<CreateFinanceEntrySchema> = {},
): CreateFinanceEntrySchema {
  const issueDate = overrides.issueDate ?? faker.date.recent({ days: 30 });
  const dueDate =
    overrides.dueDate ??
    faker.date.soon({ days: faker.number.int({ min: 5, max: 60 }), refDate: issueDate });

  return {
    tenantId: overrides.tenantId ?? new UniqueEntityID().toString(),
    type: overrides.type ?? faker.helpers.arrayElement(['PAYABLE', 'RECEIVABLE']),
    code:
      overrides.code ??
      `FIN-${faker.string.alphanumeric({ length: 6, casing: 'upper' })}`,
    description: overrides.description ?? faker.commerce.productDescription(),
    notes: overrides.notes,
    categoryId: overrides.categoryId ?? new UniqueEntityID().toString(),
    chartOfAccountId: overrides.chartOfAccountId,
    companyId: overrides.companyId,
    costCenterId: overrides.costCenterId,
    bankAccountId: overrides.bankAccountId,
    supplierName: overrides.supplierName,
    customerName: overrides.customerName,
    supplierId: overrides.supplierId,
    customerId: overrides.customerId,
    salesOrderId: overrides.salesOrderId,
    expectedAmount:
      overrides.expectedAmount ??
      faker.number.float({ min: 100, max: 10_000, fractionDigits: 2 }),
    actualAmount: overrides.actualAmount,
    discount: overrides.discount ?? 0,
    interest: overrides.interest ?? 0,
    penalty: overrides.penalty ?? 0,
    issueDate,
    dueDate,
    competenceDate: overrides.competenceDate,
    paymentDate: overrides.paymentDate,
    status: overrides.status ?? 'PENDING',
    recurrenceType: overrides.recurrenceType ?? 'SINGLE',
    recurrenceInterval: overrides.recurrenceInterval,
    recurrenceUnit: overrides.recurrenceUnit,
    totalInstallments: overrides.totalInstallments,
    currentInstallment: overrides.currentInstallment,
    parentEntryId: overrides.parentEntryId,
    contractId: overrides.contractId,
    fiscalDocumentId: overrides.fiscalDocumentId,
    boletoBarcode: overrides.boletoBarcode,
    boletoDigitLine: overrides.boletoDigitLine,
    boletoChargeId: overrides.boletoChargeId,
    boletoBarcodeNumber: overrides.boletoBarcodeNumber,
    boletoDigitableLine: overrides.boletoDigitableLine,
    boletoPdfUrl: overrides.boletoPdfUrl,
    beneficiaryName: overrides.beneficiaryName,
    beneficiaryCpfCnpj: overrides.beneficiaryCpfCnpj,
    pixKey: overrides.pixKey,
    pixKeyType: overrides.pixKeyType,
    pixChargeId: overrides.pixChargeId,
    metadata: overrides.metadata ?? {},
    tags: overrides.tags ?? [],
    createdBy: overrides.createdBy,
  };
}
