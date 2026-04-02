import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  JournalEntriesRepository,
  JournalEntryWithLines,
} from '@/repositories/finance/journal-entries-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface AutoJournalFromEntryRequest {
  tenantId: string;
  entryId: string;
  createdBy?: string;
}

interface AutoJournalFromEntryResponse {
  journalEntry: JournalEntryWithLines;
}

// Account codes for special counterpart accounts
const FORNECEDORES_CODE = '2.1.1.01';
const CLIENTES_CODE = '1.1.2.01';

export class AutoJournalFromEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
    private chartOfAccountsRepository: ChartOfAccountsRepository,
    private journalEntriesRepository: JournalEntriesRepository,
  ) {}

  async execute(
    request: AutoJournalFromEntryRequest,
  ): Promise<AutoJournalFromEntryResponse | null> {
    const { tenantId, entryId, createdBy } = request;

    // 1. Load FinanceEntry
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      console.warn(`[AutoJournalFromEntry] FinanceEntry not found: ${entryId}`);
      return null;
    }

    // 2. Resolve chart-of-account ID
    let resolvedChartOfAccountId: string | null = null;

    if (entry.chartOfAccountId) {
      // Explicit override on entry
      resolvedChartOfAccountId = entry.chartOfAccountId;
    } else {
      // Fallback to category
      const category = await this.financeCategoriesRepository.findById(
        entry.categoryId,
        tenantId,
      );

      if (category?.chartOfAccountId) {
        resolvedChartOfAccountId = category.chartOfAccountId;
      }
    }

    if (!resolvedChartOfAccountId) {
      console.warn(
        `[AutoJournalFromEntry] No chart-of-account mapping for entry ${entryId}. Skipping journal generation.`,
      );
      return null;
    }

    // 3. Find counterpart account by code
    const counterpartCode =
      entry.type === 'PAYABLE' ? FORNECEDORES_CODE : CLIENTES_CODE;

    const counterpartAccount = await this.chartOfAccountsRepository.findByCode(
      counterpartCode,
      tenantId,
    );

    if (!counterpartAccount) {
      console.warn(
        `[AutoJournalFromEntry] Counterpart account not found for code ${counterpartCode} in tenant ${tenantId}. Skipping journal generation.`,
      );
      return null;
    }

    const counterpartAccountId = counterpartAccount.id.toString();

    // 4. Create JournalEntry
    const amount = entry.expectedAmount;
    const date = entry.competenceDate ?? entry.issueDate;
    const description = entry.description;

    const code = await this.journalEntriesRepository.generateNextCode(tenantId);

    // PAYABLE: Debit=resolved account (expense), Credit=fornecedores (liability)
    // RECEIVABLE: Debit=clientes (asset), Credit=resolved account (revenue)
    const lines =
      entry.type === 'PAYABLE'
        ? [
            {
              chartOfAccountId: resolvedChartOfAccountId,
              type: 'DEBIT' as const,
              amount,
              description,
            },
            {
              chartOfAccountId: counterpartAccountId,
              type: 'CREDIT' as const,
              amount,
              description,
            },
          ]
        : [
            {
              chartOfAccountId: counterpartAccountId,
              type: 'DEBIT' as const,
              amount,
              description,
            },
            {
              chartOfAccountId: resolvedChartOfAccountId,
              type: 'CREDIT' as const,
              amount,
              description,
            },
          ];

    const journalEntry = await this.journalEntriesRepository.create({
      tenantId,
      code,
      date,
      description,
      sourceType: 'FINANCE_ENTRY',
      sourceId: entryId,
      lines,
      createdBy,
    });

    return { journalEntry };
  }
}
