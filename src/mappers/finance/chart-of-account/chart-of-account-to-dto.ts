import type { ChartOfAccount } from '@/entities/finance/chart-of-account';

export interface ChartOfAccountDTO {
  id: string;
  code: string;
  name: string;
  type: string;
  accountClass: string;
  nature: string;
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
    type: chartOfAccount.type,
    accountClass: chartOfAccount.accountClass,
    nature: chartOfAccount.nature,
    parentId: chartOfAccount.parentId?.toString(),
    isActive: chartOfAccount.isActive,
    isSystem: chartOfAccount.isSystem,
    createdAt: chartOfAccount.createdAt,
    updatedAt: chartOfAccount.updatedAt,
    deletedAt: chartOfAccount.deletedAt,
  };
}
