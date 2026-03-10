import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { LoansRepository } from '@/repositories/finance/loans-repository';
import type { LoanInstallmentsRepository } from '@/repositories/finance/loan-installments-repository';

interface LinkInstallmentsToEntriesRequest {
  tenantId: string;
  loanId: string;
  categoryId: string;
}

interface LinkInstallmentsToEntriesResponse {
  entriesCreated: number;
}

export class LinkInstallmentsToEntriesUseCase {
  constructor(
    private loansRepository: LoansRepository,
    private loanInstallmentsRepository: LoanInstallmentsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private categoriesRepository: FinanceCategoriesRepository,
    private costCentersRepository: CostCentersRepository,
  ) {}

  async execute(
    request: LinkInstallmentsToEntriesRequest,
  ): Promise<LinkInstallmentsToEntriesResponse> {
    const { tenantId, loanId, categoryId } = request;

    // Validate loan exists
    const loan = await this.loansRepository.findById(
      new UniqueEntityID(loanId),
      tenantId,
    );
    if (!loan) {
      throw new ResourceNotFoundError('Loan not found');
    }

    // Fetch all installments for this loan
    const installments = await this.loanInstallmentsRepository.findByLoanId(
      new UniqueEntityID(loanId),
    );

    // Get existing entries to check for already-linked installments (idempotency)
    const existingEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'PAYABLE',
      limit: 1000,
    });

    // Build a set of descriptions that already exist to detect linked installments
    const existingDescriptions = new Set(
      existingEntries.entries.map((e) => e.description),
    );

    let entriesCreated = 0;

    for (const installment of installments) {
      if (installment.status === 'PAID') continue;

      const description = `Parcela ${installment.installmentNumber}/${loan.totalInstallments} - ${loan.name}`;

      // Skip if already linked (idempotent)
      if (existingDescriptions.has(description)) continue;

      const code = await this.financeEntriesRepository.generateNextCode(
        tenantId,
        'PAYABLE',
      );

      await this.financeEntriesRepository.create({
        tenantId,
        type: 'PAYABLE',
        code,
        description,
        categoryId,
        costCenterId: loan.costCenterId.toString(),
        bankAccountId: loan.bankAccountId.toString(),
        expectedAmount: installment.totalAmount,
        issueDate: new Date(),
        dueDate: installment.dueDate,
      });

      entriesCreated++;
    }

    return { entriesCreated };
  }
}
