import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankAccount } from '@/entities/finance/bank-account';
import type { BankAccount as PrismaBankAccount } from '@prisma/generated/client.js';

export function mapBankAccountPrismaToDomain(data: PrismaBankAccount) {
  return {
    id: new UniqueEntityID(data.id),
    tenantId: new UniqueEntityID(data.tenantId),
    companyId: new UniqueEntityID(data.companyId),
    name: data.name,
    bankCode: data.bankCode,
    bankName: data.bankName ?? undefined,
    agency: data.agency,
    agencyDigit: data.agencyDigit ?? undefined,
    accountNumber: data.accountNumber,
    accountDigit: data.accountDigit ?? undefined,
    accountType: data.accountType,
    status: data.status,
    pixKeyType: data.pixKeyType ?? undefined,
    pixKey: data.pixKey ?? undefined,
    currentBalance: Number(data.currentBalance.toString()),
    balanceUpdatedAt: data.balanceUpdatedAt ?? undefined,
    color: data.color ?? undefined,
    isDefault: data.isDefault,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt ?? undefined,
  };
}

export function bankAccountPrismaToDomain(
  data: PrismaBankAccount,
): BankAccount {
  return BankAccount.create(
    mapBankAccountPrismaToDomain(data),
    new UniqueEntityID(data.id),
  );
}
