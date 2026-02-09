import type { BankAccount } from '@/entities/finance/bank-account';

export interface BankAccountDTO {
  id: string;
  companyId: string;
  name: string;
  bankCode: string;
  bankName?: string;
  agency: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit?: string;
  accountType: string;
  status: string;
  pixKeyType?: string;
  pixKey?: string;
  currentBalance: number;
  balanceUpdatedAt?: Date;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function bankAccountToDTO(bankAccount: BankAccount): BankAccountDTO {
  return {
    id: bankAccount.id.toString(),
    companyId: bankAccount.companyId.toString(),
    name: bankAccount.name,
    bankCode: bankAccount.bankCode,
    bankName: bankAccount.bankName,
    agency: bankAccount.agency,
    agencyDigit: bankAccount.agencyDigit,
    accountNumber: bankAccount.accountNumber,
    accountDigit: bankAccount.accountDigit,
    accountType: bankAccount.accountType,
    status: bankAccount.status,
    pixKeyType: bankAccount.pixKeyType,
    pixKey: bankAccount.pixKey,
    currentBalance: bankAccount.currentBalance,
    balanceUpdatedAt: bankAccount.balanceUpdatedAt,
    color: bankAccount.color,
    isDefault: bankAccount.isDefault,
    createdAt: bankAccount.createdAt,
    updatedAt: bankAccount.updatedAt,
    deletedAt: bankAccount.deletedAt,
  };
}
