import { prisma } from '@/lib/prisma';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JournalSourceType } from '@/entities/finance/journal-entry';
import { journalEntryToDTO } from '@/mappers/finance/journal-entry/journal-entry-to-dto';
import type {
  CreateJournalEntryData,
  JournalEntriesRepository,
  JournalEntryWithLines,
  LedgerEntry,
  TrialBalanceAccount,
} from '../journal-entries-repository';
import { Prisma } from '@prisma/generated/client.js';

export class PrismaJournalEntriesRepository
  implements JournalEntriesRepository
{
  async create(data: CreateJournalEntryData): Promise<JournalEntryWithLines> {
    const entry = await prisma.journalEntry.create({
      data: {
        tenantId: data.tenantId,
        code: data.code,
        date: data.date,
        description: data.description,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        createdBy: data.createdBy,
        lines: {
          create: data.lines.map((line) => ({
            chartOfAccountId: line.chartOfAccountId,
            type: line.type,
            amount: new Prisma.Decimal(line.amount),
            description: line.description,
          })),
        },
      },
      include: {
        lines: {
          include: {
            chartOfAccount: true,
          },
        },
      },
    });

    return journalEntryToDTO(entry);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<JournalEntryWithLines | null> {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
      include: {
        lines: {
          include: {
            chartOfAccount: true,
          },
        },
      },
    });

    if (!entry) return null;
    return journalEntryToDTO(entry);
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

    const where: Prisma.JournalEntryWhereInput = { tenantId };

    if (options?.chartOfAccountId) {
      where.lines = {
        some: { chartOfAccountId: options.chartOfAccountId },
      };
    }

    if (options?.sourceType) {
      where.sourceType = options.sourceType;
    }

    if (options?.sourceId) {
      where.sourceId = options.sourceId;
    }

    if (options?.dateFrom || options?.dateTo) {
      where.date = {
        ...(options.dateFrom && { gte: options.dateFrom }),
        ...(options.dateTo && { lte: options.dateTo }),
      };
    }

    const [raw, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lines: {
            include: {
              chartOfAccount: true,
            },
          },
        },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return {
      entries: raw.map(journalEntryToDTO),
      total,
    };
  }

  async findBySource(
    tenantId: string,
    sourceType: JournalSourceType,
    sourceId: string,
  ): Promise<JournalEntryWithLines[]> {
    const raw = await prisma.journalEntry.findMany({
      where: { tenantId, sourceType, sourceId },
      include: {
        lines: {
          include: {
            chartOfAccount: true,
          },
        },
      },
    });

    return raw.map(journalEntryToDTO);
  }

  async generateNextCode(tenantId: string): Promise<string> {
    const result = await prisma.$queryRaw<[{ last_value: number }]>`
      INSERT INTO finance_code_sequences (id, tenant_id, prefix, last_value)
      VALUES (gen_random_uuid(), ${tenantId}, ${'LC'}, 1)
      ON CONFLICT (tenant_id, prefix)
      DO UPDATE SET last_value = finance_code_sequences.last_value + 1
      RETURNING last_value
    `;

    const nextNumber = result[0].last_value.toString().padStart(6, '0');
    return `LC-${nextNumber}`;
  }

  async markReversed(id: UniqueEntityID, reversedById: string): Promise<void> {
    await prisma.journalEntry.update({
      where: { id: id.toString() },
      data: {
        status: 'REVERSED',
        reversedById,
      },
    });
  }

  async getLedger(
    tenantId: string,
    chartOfAccountId: string,
    from: Date,
    to: Date,
  ): Promise<LedgerEntry[]> {
    type RawLedgerRow = {
      date: Date;
      journalEntryId: string;
      journalCode: string;
      description: string;
      debit: Prisma.Decimal;
      credit: Prisma.Decimal;
      sourceType: string;
      sourceId: string | null;
    };

    const rows = await prisma.$queryRaw<RawLedgerRow[]>`
      SELECT
        je.date,
        je.id AS "journalEntryId",
        je.code AS "journalCode",
        je.description,
        CASE WHEN jel.type = 'DEBIT' THEN jel.amount ELSE 0 END AS debit,
        CASE WHEN jel.type = 'CREDIT' THEN jel.amount ELSE 0 END AS credit,
        je.source_type AS "sourceType",
        je.source_id AS "sourceId"
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.id = jel.journal_entry_id
      WHERE je.tenant_id = ${tenantId}
        AND jel.chart_of_account_id = ${chartOfAccountId}
        AND je.date >= ${from}
        AND je.date <= ${to}
        AND je.status = 'POSTED'
      ORDER BY je.date ASC, je.created_at ASC
    `;

    let runningBalance = 0;
    return rows.map((row) => {
      const debit = Number(parseFloat(String(row.debit)).toFixed(2));
      const credit = Number(parseFloat(String(row.credit)).toFixed(2));
      runningBalance += debit - credit;

      return {
        date: row.date,
        journalEntryId: row.journalEntryId,
        journalCode: row.journalCode,
        description: row.description,
        debit,
        credit,
        balance: Number(runningBalance.toFixed(2)),
        sourceType: row.sourceType as JournalSourceType,
        sourceId: row.sourceId,
      };
    });
  }

  async getTrialBalance(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<TrialBalanceAccount[]> {
    type RawTrialBalanceRow = {
      id: string;
      code: string;
      name: string;
      type: string;
      nature: string;
      debitTotal: Prisma.Decimal;
      creditTotal: Prisma.Decimal;
    };

    const rows = await prisma.$queryRaw<RawTrialBalanceRow[]>`
      SELECT
        coa.id,
        coa.code,
        coa.name,
        coa.type,
        coa.nature,
        SUM(CASE WHEN jel.type = 'DEBIT' THEN jel.amount ELSE 0 END) AS "debitTotal",
        SUM(CASE WHEN jel.type = 'CREDIT' THEN jel.amount ELSE 0 END) AS "creditTotal"
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.id = jel.journal_entry_id
      JOIN chart_of_accounts coa ON coa.id = jel.chart_of_account_id
      WHERE je.tenant_id = ${tenantId}
        AND je.date >= ${from}
        AND je.date <= ${to}
        AND je.status = 'POSTED'
        AND coa.deleted_at IS NULL
      GROUP BY coa.id, coa.code, coa.name, coa.type, coa.nature
      ORDER BY coa.code ASC
    `;

    return rows.map((row) => {
      const debitTotal = Number(parseFloat(String(row.debitTotal)).toFixed(2));
      const creditTotal = Number(
        parseFloat(String(row.creditTotal)).toFixed(2),
      );
      const level = (row.code.match(/\./g) ?? []).length + 1;
      const balance =
        row.nature === 'DEBIT'
          ? debitTotal - creditTotal
          : creditTotal - debitTotal;

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type,
        nature: row.nature,
        level,
        debitTotal,
        creditTotal,
        balance: Number(balance.toFixed(2)),
      };
    });
  }
}
