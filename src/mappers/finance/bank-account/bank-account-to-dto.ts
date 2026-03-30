import type { BankAccount } from '@/entities/finance/bank-account';
import {
  maskAccountNumber,
  maskPixKey,
} from '@/utils/finance/mask-sensitive-data';

export interface BankAccountDTO {
  id: string;
  companyId?: string;
  name: string;
  bankCode: string;
  bankName?: string;
  agency: string;
  agencyDigit?: string;
  accountNumber: string;
  accountDigit?: string;
  maskedAccountNumber: string;
  accountType: string;
  status: string;
  pixKeyType?: string;
  pixKey?: string;
  maskedPixKey?: string | null;
  currentBalance: number;
  balanceUpdatedAt?: Date;
  color?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function bankAccountToDTO(
  bankAccount: BankAccount,
  options?: { maskSensitiveData?: boolean },
): BankAccountDTO {
  const shouldMask = options?.maskSensitiveData ?? false;

  return {
    id: bankAccount.id.toString(),
    companyId: bankAccount.companyId?.toString(),
    name: bankAccount.name,
    bankCode: bankAccount.bankCode,
    bankName: bankAccount.bankName,
    agency: bankAccount.agency,
    agencyDigit: bankAccount.agencyDigit,
    accountNumber: shouldMask
      ? maskAccountNumber(bankAccount.accountNumber)
      : bankAccount.accountNumber,
    accountDigit: bankAccount.accountDigit,
    maskedAccountNumber: maskAccountNumber(bankAccount.accountNumber),
    accountType: bankAccount.accountType,
    status: bankAccount.status,
    pixKeyType: bankAccount.pixKeyType,
    pixKey: shouldMask ? undefined : bankAccount.pixKey,
    maskedPixKey: maskPixKey(bankAccount.pixKey),
    currentBalance: bankAccount.currentBalance,
    balanceUpdatedAt: bankAccount.balanceUpdatedAt,
    color: bankAccount.color,
    isDefault: bankAccount.isDefault,
    createdAt: bankAccount.createdAt,
    updatedAt: bankAccount.updatedAt,
    deletedAt: bankAccount.deletedAt,
  };
}
