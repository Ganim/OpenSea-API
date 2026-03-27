import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateFinanceEntryRetentionSchema {
  tenantId: string;
  entryId: string;
  taxType: 'IRRF' | 'ISS' | 'INSS' | 'PIS' | 'COFINS' | 'CSLL';
  grossAmount: number;
  rate: number;
  amount: number;
  withheld?: boolean;
  description?: string;
}

export interface FinanceEntryRetentionRecord {
  id: string;
  tenantId: string;
  entryId: string;
  taxType: string;
  grossAmount: number;
  rate: number;
  amount: number;
  withheld: boolean;
  description: string | null;
  createdAt: Date;
}

export interface FinanceEntryRetentionsRepository {
  createMany(
    data: CreateFinanceEntryRetentionSchema[],
    tx?: TransactionClient,
  ): Promise<FinanceEntryRetentionRecord[]>;

  findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<FinanceEntryRetentionRecord[]>;

  findByEntryIds(
    entryIds: string[],
    tenantId: string,
  ): Promise<FinanceEntryRetentionRecord[]>;

  deleteByEntryId(
    entryId: string,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<number>;
}
