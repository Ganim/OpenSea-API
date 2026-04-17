import { randomUUID } from 'node:crypto';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JournalSourceType } from '@/entities/finance/journal-entry';
import type {
  CreateJournalEntryData,
  JournalEntriesRepository,
  JournalEntryWithLines,
  LedgerEntry,
  TrialBalanceAccount,
} from '../journal-entries-repository';

export class InMemoryJournalEntriesRepository
  implements JournalEntriesRepository
{
  public items: JournalEntryWithLines[] = [];

  // In-memory store for chart-of-account metadata used in trial balance
  public chartOfAccounts: Array<{
    id: string;
    code: string;
    name: string;
    type: string;
    nature: string;
  }> = [];

  async create(data: CreateJournalEntryData): Promise<JournalEntryWithLines> {
    const now = new Date();
    const headerCompanyId = data.companyId ?? null;
    const headerCostCenterId = data.costCenterId ?? null;
    const entry: JournalEntryWithLines = {
      id: randomUUID(),
      tenantId: data.tenantId,
      code: data.code,
      date: data.date,
      description: data.description,
      sourceType: data.sourceType,
      sourceId: data.sourceId ?? null,
      companyId: headerCompanyId,
      costCenterId: headerCostCenterId,
      status: 'POSTED',
      reversedById: null,
      createdBy: data.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
      lines: data.lines.map((line) => {
        const coa = this.chartOfAccounts.find(
          (c) => c.id === line.chartOfAccountId,
        );
        return {
          id: randomUUID(),
          chartOfAccountId: line.chartOfAccountId,
          chartOfAccountCode: coa?.code,
          chartOfAccountName: coa?.name,
          type: line.type,
          amount: line.amount,
          description: line.description ?? null,
          companyId: line.companyId ?? headerCompanyId,
          costCenterId: line.costCenterId ?? headerCostCenterId,
        };
      }),
    };

    this.items.push(entry);
    return entry;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<JournalEntryWithLines | null> {
    const entry = this.items.find(
      (i) => i.id === id.toString() && i.tenantId === tenantId,
    );
    return entry ?? null;
  }

  async findMany(
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
  ): Promise<{ entries: JournalEntryWithLines[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    let filtered = this.items.filter((i) => i.tenantId === tenantId);

    if (options?.chartOfAccountId) {
      filtered = filtered.filter((i) =>
        i.lines.some((l) => l.chartOfAccountId === options.chartOfAccountId),
      );
    }

    if (options?.sourceType) {
      filtered = filtered.filter((i) => i.sourceType === options.sourceType);
    }

    if (options?.sourceId) {
      filtered = filtered.filter((i) => i.sourceId === options.sourceId);
    }

    if (options?.dateFrom) {
      filtered = filtered.filter((i) => i.date >= options.dateFrom!);
    }

    if (options?.dateTo) {
      filtered = filtered.filter((i) => i.date <= options.dateTo!);
    }

    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const entries = filtered.slice(offset, offset + limit);

    return { entries, total };
  }

  async findBySource(
    tenantId: string,
    sourceType: JournalSourceType,
    sourceId: string,
  ): Promise<JournalEntryWithLines[]> {
    return this.items.filter(
      (i) =>
        i.tenantId === tenantId &&
        i.sourceType === sourceType &&
        i.sourceId === sourceId,
    );
  }

  async generateNextCode(tenantId: string): Promise<string> {
    const count = this.items.filter((i) => i.tenantId === tenantId).length;
    return `LC-${String(count + 1).padStart(6, '0')}`;
  }

  async markReversed(
    id: UniqueEntityID,
    tenantId: string,
    reversedById: string,
  ): Promise<void> {
    const entry = this.items.find(
      (i) => i.id === id.toString() && i.tenantId === tenantId,
    );
    if (entry) {
      entry.status = 'REVERSED';
      entry.reversedById = reversedById;
      entry.updatedAt = new Date();
    }
  }

  async getLedger(
    tenantId: string,
    chartOfAccountId: string,
    from: Date,
    to: Date,
  ): Promise<LedgerEntry[]> {
    const relevant = this.items
      .filter(
        (i) =>
          i.tenantId === tenantId &&
          i.status === 'POSTED' &&
          i.date >= from &&
          i.date <= to &&
          i.lines.some((l) => l.chartOfAccountId === chartOfAccountId),
      )
      .sort((a, b) => {
        const dateDiff =
          new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });

    let runningBalance = 0;
    const ledgerEntries: LedgerEntry[] = [];

    for (const entry of relevant) {
      for (const line of entry.lines) {
        if (line.chartOfAccountId !== chartOfAccountId) continue;

        const debit = line.type === 'DEBIT' ? line.amount : 0;
        const credit = line.type === 'CREDIT' ? line.amount : 0;
        runningBalance += debit - credit;

        ledgerEntries.push({
          date: entry.date,
          journalEntryId: entry.id,
          journalCode: entry.code,
          description: entry.description,
          debit,
          credit,
          balance: runningBalance,
          sourceType: entry.sourceType,
          sourceId: entry.sourceId,
        });
      }
    }

    return ledgerEntries;
  }

  async getTrialBalance(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TrialBalanceAccount[]> {
    const relevant = this.items.filter(
      (i) =>
        i.tenantId === tenantId &&
        i.status === 'POSTED' &&
        i.date >= from &&
        i.date <= to,
    );

    const accountMap = new Map<
      string,
      { debitTotal: number; creditTotal: number }
    >();

    for (const entry of relevant) {
      for (const line of entry.lines) {
        const existing = accountMap.get(line.chartOfAccountId) ?? {
          debitTotal: 0,
          creditTotal: 0,
        };
        if (line.type === 'DEBIT') {
          existing.debitTotal += line.amount;
        } else {
          existing.creditTotal += line.amount;
        }
        accountMap.set(line.chartOfAccountId, existing);
      }
    }

    const result: TrialBalanceAccount[] = [];

    for (const [accountId, totals] of accountMap.entries()) {
      const coa = this.chartOfAccounts.find((c) => c.id === accountId);
      if (!coa) continue;

      const level = (coa.code.match(/\./g) ?? []).length + 1;
      const balance =
        coa.nature === 'DEBIT'
          ? totals.debitTotal - totals.creditTotal
          : totals.creditTotal - totals.debitTotal;

      result.push({
        id: coa.id,
        code: coa.code,
        name: coa.name,
        type: coa.type,
        nature: coa.nature,
        level,
        debitTotal: totals.debitTotal,
        creditTotal: totals.creditTotal,
        balance,
      });
    }

    return result.sort((a, b) => a.code.localeCompare(b.code));
  }
}
