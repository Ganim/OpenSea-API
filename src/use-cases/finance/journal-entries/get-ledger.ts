import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';
import type {
  JournalEntriesRepository,
  LedgerEntry,
} from '@/repositories/finance/journal-entries-repository';

interface GetLedgerUseCaseRequest {
  tenantId: string;
  chartOfAccountId: string;
  from: Date;
  to: Date;
}

interface AccountInfo {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
}

interface GetLedgerUseCaseResponse {
  account: AccountInfo;
  period: { from: Date; to: Date };
  openingBalance: number;
  entries: LedgerEntry[];
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
}

export class GetLedgerUseCase {
  constructor(
    private chartOfAccountsRepository: ChartOfAccountsRepository,
    private journalEntriesRepository: JournalEntriesRepository,
  ) {}

  async execute({
    tenantId,
    chartOfAccountId,
    from,
    to,
  }: GetLedgerUseCaseRequest): Promise<GetLedgerUseCaseResponse> {
    const account = await this.chartOfAccountsRepository.findById(
      new UniqueEntityID(chartOfAccountId),
      tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError(
        'Conta contábil não encontrada',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Compute opening balance: sum of all journal lines for this account BEFORE `from`
    const priorEntries = await this.journalEntriesRepository.getLedger(
      tenantId,
      chartOfAccountId,
      new Date('1970-01-01'),
      new Date(from.getTime() - 1), // exclusive: everything before `from`
    );

    let openingBalance = 0;
    for (const entry of priorEntries) {
      if (account.nature === 'DEBIT') {
        openingBalance += entry.debit - entry.credit;
      } else {
        openingBalance += entry.credit - entry.debit;
      }
    }

    // Get period entries
    const entries = await this.journalEntriesRepository.getLedger(
      tenantId,
      chartOfAccountId,
      from,
      to,
    );

    let totalDebits = 0;
    let totalCredits = 0;
    for (const entry of entries) {
      totalDebits += entry.debit;
      totalCredits += entry.credit;
    }

    const closingBalance =
      account.nature === 'DEBIT'
        ? openingBalance + totalDebits - totalCredits
        : openingBalance + totalCredits - totalDebits;

    return {
      account: {
        id: account.id.toString(),
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
      },
      period: { from, to },
      openingBalance,
      entries,
      closingBalance,
      totalDebits,
      totalCredits,
    };
  }
}
