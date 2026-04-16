import type { JournalSourceType } from '@/entities/finance/journal-entry';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreateJournalEntryData {
  tenantId: string;
  code: string;
  date: Date;
  description: string;
  sourceType: JournalSourceType;
  sourceId?: string;
  createdBy?: string;
  lines: Array<{
    chartOfAccountId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description?: string;
  }>;
}

export interface JournalEntryWithLines {
  id: string;
  tenantId: string;
  code: string;
  date: Date;
  description: string;
  sourceType: JournalSourceType;
  sourceId: string | null;
  status: string;
  reversedById: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: Array<{
    id: string;
    chartOfAccountId: string;
    chartOfAccountCode?: string;
    chartOfAccountName?: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description: string | null;
  }>;
}

export interface LedgerEntry {
  date: Date;
  journalEntryId: string;
  journalCode: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  sourceType: JournalSourceType;
  sourceId: string | null;
}

export interface TrialBalanceAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  level: number;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export interface JournalEntriesRepository {
  create(data: CreateJournalEntryData): Promise<JournalEntryWithLines>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<JournalEntryWithLines | null>;
  findMany(
    tenantId: string,
    options?: {
      page?: number;
      limit?: number;
      chartOfAccountId?: string;
      sourceType?: JournalSourceType;
      sourceId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<{ entries: JournalEntryWithLines[]; total: number }>;
  findBySource(
    tenantId: string,
    sourceType: JournalSourceType,
    sourceId: string,
  ): Promise<JournalEntryWithLines[]>;
  generateNextCode(tenantId: string): Promise<string>;
  markReversed(
    id: UniqueEntityID,
    tenantId: string,
    reversedById: string,
  ): Promise<void>;
  getLedger(
    tenantId: string,
    chartOfAccountId: string,
    from: Date,
    to: Date,
  ): Promise<LedgerEntry[]>;
  getTrialBalance(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TrialBalanceAccount[]>;
}
