import type { ChartOfAccount } from '@/entities/finance/chart-of-account';

export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE';
export type AccountClass =
  | 'CURRENT'
  | 'NON_CURRENT'
  | 'OPERATIONAL'
  | 'FINANCIAL'
  | 'OTHER';
export type AccountNature = 'DEBIT' | 'CREDIT';

export interface ChartOfAccountDTO {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  accountClass: AccountClass;
  nature: AccountNature;
  parentId?: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function chartOfAccountToDTO(
  chartOfAccount: ChartOfAccount,
): ChartOfAccountDTO {
  return {
    id: chartOfAccount.id.toString(),
    code: chartOfAccount.code,
    name: chartOfAccount.name,
    type: chartOfAccount.type as AccountType,
    accountClass: chartOfAccount.accountClass as AccountClass,
    nature: chartOfAccount.nature as AccountNature,
    parentId: chartOfAccount.parentId?.toString(),
    isActive: chartOfAccount.isActive,
    isSystem: chartOfAccount.isSystem,
    createdAt: chartOfAccount.createdAt,
    updatedAt: chartOfAccount.updatedAt,
    deletedAt: chartOfAccount.deletedAt,
  };
}
