import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';
import type { ContractsRepository } from '@/repositories/finance/contracts-repository';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { LoansRepository } from '@/repositories/finance/loans-repository';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface GetFinanceOverviewRequest {
  tenantId: string;
}

interface EntryTypeCounts {
  total: number;
  pending: number;
  overdue: number;
}

interface EntityCounts {
  total: number;
  active: number;
}

export interface GetFinanceOverviewResponse {
  payable: EntryTypeCounts;
  receivable: EntryTypeCounts;
  loans: EntityCounts;
  consortia: EntityCounts;
  contracts: EntityCounts;
  recurring: EntityCounts;
  bankAccounts: number;
  categories: number;
  costCenters: number;
}

export class GetFinanceOverviewUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private loansRepository: LoansRepository,
    private consortiaRepository: ConsortiaRepository,
    private contractsRepository: ContractsRepository,
    private recurringConfigsRepository: RecurringConfigsRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
    private costCentersRepository: CostCentersRepository,
  ) {}

  async execute(
    request: GetFinanceOverviewRequest,
  ): Promise<GetFinanceOverviewResponse> {
    const { tenantId } = request;

    const [
      payableResult,
      payablePendingResult,
      payableOverdueResult,
      receivableResult,
      receivablePendingResult,
      receivableOverdueResult,
      loansResult,
      loansActiveResult,
      consortiaResult,
      consortiaActiveResult,
      contractsResult,
      contractsActiveResult,
      recurringResult,
      recurringActiveResult,
      bankAccounts,
      categories,
      costCenters,
    ] = await Promise.all([
      // Payable counts
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        page: 1,
        limit: 1,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        status: 'PENDING',
        page: 1,
        limit: 1,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        status: 'OVERDUE',
        page: 1,
        limit: 1,
      }),
      // Receivable counts
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        page: 1,
        limit: 1,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        status: 'PENDING',
        page: 1,
        limit: 1,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        status: 'OVERDUE',
        page: 1,
        limit: 1,
      }),
      // Loans
      this.loansRepository.findMany({ tenantId, page: 1, limit: 1 }),
      this.loansRepository.findMany({
        tenantId,
        status: 'ACTIVE',
        page: 1,
        limit: 1,
      }),
      // Consortia
      this.consortiaRepository.findMany({ tenantId, page: 1, limit: 1 }),
      this.consortiaRepository.findMany({
        tenantId,
        status: 'ACTIVE',
        page: 1,
        limit: 1,
      }),
      // Contracts
      this.contractsRepository.findMany({ tenantId, page: 1, limit: 1 }),
      this.contractsRepository.findMany({
        tenantId,
        status: 'ACTIVE',
        page: 1,
        limit: 1,
      }),
      // Recurring
      this.recurringConfigsRepository.findMany({
        tenantId,
        page: 1,
        limit: 1,
      }),
      this.recurringConfigsRepository.findMany({
        tenantId,
        status: 'ACTIVE',
        page: 1,
        limit: 1,
      }),
      // Simple counts
      this.bankAccountsRepository.findMany(tenantId),
      this.financeCategoriesRepository.findMany(tenantId),
      this.costCentersRepository.findMany(tenantId),
    ]);

    return {
      payable: {
        total: payableResult.total,
        pending: payablePendingResult.total,
        overdue: payableOverdueResult.total,
      },
      receivable: {
        total: receivableResult.total,
        pending: receivablePendingResult.total,
        overdue: receivableOverdueResult.total,
      },
      loans: {
        total: loansResult.total,
        active: loansActiveResult.total,
      },
      consortia: {
        total: consortiaResult.total,
        active: consortiaActiveResult.total,
      },
      contracts: {
        total: contractsResult.total,
        active: contractsActiveResult.total,
      },
      recurring: {
        total: recurringResult.total,
        active: recurringActiveResult.total,
      },
      bankAccounts: bankAccounts.length,
      categories: categories.length,
      costCenters: costCenters.length,
    };
  }
}
