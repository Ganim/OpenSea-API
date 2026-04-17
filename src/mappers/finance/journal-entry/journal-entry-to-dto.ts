import type { JournalSourceType } from '@/entities/finance/journal-entry';
import type { JournalEntryWithLines } from '@/repositories/finance/journal-entries-repository';
import { Prisma } from '@prisma/generated/client.js';

interface PrismaJournalEntryLine {
  id: string;
  chartOfAccountId: string;
  type: string;
  amount: Prisma.Decimal;
  description: string | null;
  companyId: string | null;
  costCenterId: string | null;
  chartOfAccount?: {
    code: string;
    name: string;
  } | null;
}

interface PrismaJournalEntry {
  id: string;
  tenantId: string;
  code: string;
  date: Date;
  description: string;
  sourceType: string;
  sourceId: string | null;
  companyId: string | null;
  costCenterId: string | null;
  status: string;
  reversedById: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  lines: PrismaJournalEntryLine[];
}

export function journalEntryToDTO(
  entry: PrismaJournalEntry,
): JournalEntryWithLines {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    code: entry.code,
    date: entry.date,
    description: entry.description,
    sourceType: entry.sourceType as JournalSourceType,
    sourceId: entry.sourceId,
    companyId: entry.companyId,
    costCenterId: entry.costCenterId,
    status: entry.status,
    reversedById: entry.reversedById,
    createdBy: entry.createdBy,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    lines: entry.lines.map((line) => ({
      id: line.id,
      chartOfAccountId: line.chartOfAccountId,
      chartOfAccountCode: line.chartOfAccount?.code,
      chartOfAccountName: line.chartOfAccount?.name,
      type: line.type as 'DEBIT' | 'CREDIT',
      amount: Number(parseFloat(String(line.amount)).toFixed(2)),
      description: line.description,
      companyId: line.companyId,
      costCenterId: line.costCenterId,
    })),
  };
}
