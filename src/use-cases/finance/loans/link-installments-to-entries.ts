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

    // Get existing PAYABLE entries and index the set of installment ids
    // already linked via metadata.loanInstallmentId. Using the installment id
    // as the idempotency key (instead of the rendered description) is stable
    // across loan renames — renaming a loan used to duplicate every entry.
    const existingEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      type: 'PAYABLE',
      limit: 1000,
    });

    const linkedInstallmentIds = new Set<string>();
    for (const existing of existingEntries.entries) {
      const linkedId = existing.metadata?.loanInstallmentId;
      if (typeof linkedId === 'string' && linkedId.length > 0) {
        linkedInstallmentIds.add(linkedId);
      }
    }

    let entriesCreated = 0;

    for (const installment of installments) {
      if (installment.status === 'PAID') continue;

      const installmentId = installment.id.toString();

      // Skip if already linked (idempotent by installment id)
      if (linkedInstallmentIds.has(installmentId)) continue;

      const description = `Parcela ${installment.installmentNumber}/${loan.totalInstallments} - ${loan.name}`;

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
        metadata: {
          loanId: loan.id.toString(),
          loanInstallmentId: installmentId,
        },
      });

      entriesCreated++;
    }

    return { entriesCreated };
  }
}
