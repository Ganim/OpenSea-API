import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntryPayment } from '@/entities/finance/finance-entry-payment';
import type { FinanceEntryPayment as PrismaPayment } from '@prisma/generated/client.js';

export function financeEntryPaymentPrismaToDomain(raw: PrismaPayment): FinanceEntryPayment {
  return FinanceEntryPayment.create(
    {
      id: new UniqueEntityID(raw.id),
      entryId: new UniqueEntityID(raw.entryId),
      bankAccountId: raw.bankAccountId ? new UniqueEntityID(raw.bankAccountId) : undefined,
      amount: Number(raw.amount),
      paidAt: raw.paidAt,
      method: raw.method ?? undefined,
      reference: raw.reference ?? undefined,
      notes: raw.notes ?? undefined,
      createdBy: raw.createdBy ?? undefined,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}
