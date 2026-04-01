import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  JournalEntriesRepository,
  JournalEntryWithLines,
} from '@/repositories/finance/journal-entries-repository';

interface AutoJournalFromPaymentRequest {
  tenantId: string;
  entryId: string;
  paymentId: string;
  bankAccountId: string;
  amount: number;
  paidAt: Date;
  createdBy?: string;
}

interface AutoJournalFromPaymentResponse {
  journalEntry: JournalEntryWithLines;
}

// Account codes for special counterpart accounts
const FORNECEDORES_CODE = '2.1.1.01';
const CLIENTES_CODE = '1.1.2.01';

export class AutoJournalFromPaymentUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private chartOfAccountsRepository: ChartOfAccountsRepository,
    private journalEntriesRepository: JournalEntriesRepository,
  ) {}

  async execute(
    request: AutoJournalFromPaymentRequest,
  ): Promise<AutoJournalFromPaymentResponse | null> {
    const {
      tenantId,
      entryId,
      paymentId,
      bankAccountId,
      amount,
      paidAt,
      createdBy,
    } = request;

    // 1. Load FinanceEntry to know type (PAYABLE/RECEIVABLE)
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      console.warn(
        `[AutoJournalFromPayment] FinanceEntry not found: ${entryId}`,
      );
      return null;
    }

    // 2. Load BankAccount and get chartOfAccountId
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );

    if (!bankAccount?.chartOfAccountId) {
      console.warn(
        `[AutoJournalFromPayment] BankAccount ${bankAccountId} has no chartOfAccountId. Skipping journal generation.`,
      );
      return null;
    }

    const bankChartOfAccountId = bankAccount.chartOfAccountId;

    // 3. Find counterpart account by code
    const counterpartCode =
      entry.type === 'PAYABLE' ? FORNECEDORES_CODE : CLIENTES_CODE;

    const counterpartAccount = await this.chartOfAccountsRepository.findByCode(
      counterpartCode,
      tenantId,
    );

    if (!counterpartAccount) {
      console.warn(
        `[AutoJournalFromPayment] Counterpart account not found for code ${counterpartCode} in tenant ${tenantId}. Skipping journal generation.`,
      );
      return null;
    }

    const counterpartAccountId = counterpartAccount.id.toString();
    const description = `Pagamento: ${entry.description}`;

    // 4. Create JournalEntry
    // PAYABLE: Debit=fornecedores (settles the liability), Credit=bank account (cash out)
    // RECEIVABLE: Debit=bank account (cash in), Credit=clientes (settles the asset)
    const lines =
      entry.type === 'PAYABLE'
        ? [
            {
              chartOfAccountId: counterpartAccountId,
              type: 'DEBIT' as const,
              amount,
              description,
            },
            {
              chartOfAccountId: bankChartOfAccountId,
              type: 'CREDIT' as const,
              amount,
              description,
            },
          ]
        : [
            {
              chartOfAccountId: bankChartOfAccountId,
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
          ];

    const code = await this.journalEntriesRepository.generateNextCode(tenantId);

    const journalEntry = await this.journalEntriesRepository.create({
      tenantId,
      code,
      date: paidAt,
      description,
      sourceType: 'FINANCE_PAYMENT',
      sourceId: paymentId,
      lines,
      createdBy,
    });

    return { journalEntry };
  }
}
