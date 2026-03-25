import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankReconciliation } from '@/entities/finance/bank-reconciliation';
import { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type {
  BankReconciliation as PrismaBankReconciliation,
  BankReconciliationItem as PrismaBankReconciliationItem,
} from '@prisma/generated/client.js';

export function bankReconciliationItemPrismaToDomain(
  data: PrismaBankReconciliationItem,
): BankReconciliationItem {
  return BankReconciliationItem.create(
    {
      id: new UniqueEntityID(data.id),
      reconciliationId: new UniqueEntityID(data.reconciliationId),
      fitId: data.fitId,
      transactionDate: data.transactionDate,
      amount: Number(data.amount.toString()),
      description: data.description,
      type: data.type as 'DEBIT' | 'CREDIT',
      matchedEntryId: data.matchedEntryId
        ? new UniqueEntityID(data.matchedEntryId)
        : undefined,
      matchConfidence: data.matchConfidence ?? undefined,
      matchStatus: data.matchStatus,
      createdAt: data.createdAt,
    },
    new UniqueEntityID(data.id),
  );
}

export function bankReconciliationPrismaToDomain(
  data: PrismaBankReconciliation & {
    items?: PrismaBankReconciliationItem[];
  },
): BankReconciliation {
  return BankReconciliation.create(
    {
      id: new UniqueEntityID(data.id),
      tenantId: new UniqueEntityID(data.tenantId),
      bankAccountId: new UniqueEntityID(data.bankAccountId),
      importDate: data.importDate,
      fileName: data.fileName,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      totalTransactions: data.totalTransactions,
      matchedCount: data.matchedCount,
      unmatchedCount: data.unmatchedCount,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      items: data.items?.map(bankReconciliationItemPrismaToDomain),
    },
    new UniqueEntityID(data.id),
  );
}
