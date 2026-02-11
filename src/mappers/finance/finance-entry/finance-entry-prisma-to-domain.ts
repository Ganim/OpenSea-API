import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntry } from '@/entities/finance/finance-entry';
import type { FinanceEntry as PrismaFinanceEntry } from '@prisma/generated/client.js';

export function financeEntryPrismaToDomain(
  raw: PrismaFinanceEntry,
): FinanceEntry {
  return FinanceEntry.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      type: raw.type,
      code: raw.code,
      description: raw.description,
      notes: raw.notes ?? undefined,
      categoryId: new UniqueEntityID(raw.categoryId),
      costCenterId: new UniqueEntityID(raw.costCenterId),
      bankAccountId: raw.bankAccountId
        ? new UniqueEntityID(raw.bankAccountId)
        : undefined,
      supplierName: raw.supplierName ?? undefined,
      customerName: raw.customerName ?? undefined,
      supplierId: raw.supplierId ?? undefined,
      customerId: raw.customerId ?? undefined,
      salesOrderId: raw.salesOrderId ?? undefined,
      expectedAmount: Number(raw.expectedAmount),
      actualAmount: raw.actualAmount ? Number(raw.actualAmount) : undefined,
      discount: Number(raw.discount),
      interest: Number(raw.interest),
      penalty: Number(raw.penalty),
      issueDate: raw.issueDate,
      dueDate: raw.dueDate,
      competenceDate: raw.competenceDate ?? undefined,
      paymentDate: raw.paymentDate ?? undefined,
      status: raw.status,
      recurrenceType: raw.recurrenceType,
      recurrenceInterval: raw.recurrenceInterval ?? undefined,
      recurrenceUnit: raw.recurrenceUnit ?? undefined,
      totalInstallments: raw.totalInstallments ?? undefined,
      currentInstallment: raw.currentInstallment ?? undefined,
      parentEntryId: raw.parentEntryId
        ? new UniqueEntityID(raw.parentEntryId)
        : undefined,
      boletoBarcode: raw.boletoBarcode ?? undefined,
      boletoDigitLine: raw.boletoDigitLine ?? undefined,
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      tags: raw.tags ?? [],
      createdBy: raw.createdBy ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
