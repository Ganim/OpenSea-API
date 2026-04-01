import type {
  JournalEntriesRepository,
  TrialBalanceAccount,
} from '@/repositories/finance/journal-entries-repository';

interface GetTrialBalanceUseCaseRequest {
  tenantId: string;
  from: Date;
  to: Date;
}

interface GetTrialBalanceUseCaseResponse {
  period: { from: Date; to: Date };
  accounts: TrialBalanceAccount[];
  totals: { debit: number; credit: number };
}

export class GetTrialBalanceUseCase {
  constructor(private journalEntriesRepository: JournalEntriesRepository) {}

  async execute({
    tenantId,
    from,
    to,
  }: GetTrialBalanceUseCaseRequest): Promise<GetTrialBalanceUseCaseResponse> {
    const accounts = await this.journalEntriesRepository.getTrialBalance(
      tenantId,
      from,
      to,
    );

    const totals = accounts.reduce(
      (acc, account) => ({
        debit: acc.debit + account.debitTotal,
        credit: acc.credit + account.creditTotal,
      }),
      { debit: 0, credit: 0 },
    );

    return {
      period: { from, to },
      accounts,
      totals,
    };
  }
}
