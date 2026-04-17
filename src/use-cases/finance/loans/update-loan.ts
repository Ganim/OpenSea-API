import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type LoanDTO, loanToDTO } from '@/mappers/finance/loan/loan-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { LoansRepository } from '@/repositories/finance/loans-repository';

interface UpdateLoanUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  type?: string;
  contractNumber?: string | null;
  notes?: string | null;
  endDate?: Date | null;
  interestRate?: number;
  // P0-32: kept loose to mirror createLoanSchema. The form sends values
  // like 'MONTHLY' / 'ANNUAL' today; tightening only here would 400 every
  // edit while leaving create unchanged.
  interestType?: string | null;
  installmentDay?: number;
  bankAccountId?: string;
  costCenterId?: string;
}

interface UpdateLoanUseCaseResponse {
  loan: LoanDTO;
}

// Fields that change the amortization plan or cash-flow side and therefore
// must be locked once any installment has been paid. Editing them after
// payments would corrupt the schedule and the generated finance entries.
const STRUCTURAL_FIELDS = [
  'type',
  'interestRate',
  'interestType',
  'installmentDay',
  'bankAccountId',
  'costCenterId',
] as const;

export class UpdateLoanUseCase {
  constructor(
    private loansRepository: LoansRepository,
    private bankAccountsRepository?: BankAccountsRepository,
    private costCentersRepository?: CostCentersRepository,
  ) {}

  async execute(
    request: UpdateLoanUseCaseRequest,
  ): Promise<UpdateLoanUseCaseResponse> {
    const { tenantId, id } = request;

    const existingLoan = await this.loansRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!existingLoan) {
      throw new ResourceNotFoundError('Loan not found');
    }

    if (existingLoan.status === 'CANCELLED') {
      throw new BadRequestError('Cannot update a cancelled loan');
    }

    if (request.name !== undefined && request.name.trim().length === 0) {
      throw new BadRequestError('Loan name cannot be empty');
    }

    const hasPaidInstallments = existingLoan.paidInstallments > 0;
    if (hasPaidInstallments) {
      for (const field of STRUCTURAL_FIELDS) {
        if (request[field] !== undefined) {
          throw new BadRequestError(
            `Cannot change "${field}" because the loan has paid installments`,
          );
        }
      }
    }

    if (request.bankAccountId && this.bankAccountsRepository) {
      const bankAccount = await this.bankAccountsRepository.findById(
        new UniqueEntityID(request.bankAccountId),
        tenantId,
      );
      if (!bankAccount) {
        throw new BadRequestError('Bank account not found');
      }
    }

    if (request.costCenterId && this.costCentersRepository) {
      const costCenter = await this.costCentersRepository.findById(
        new UniqueEntityID(request.costCenterId),
        tenantId,
      );
      if (!costCenter) {
        throw new BadRequestError('Cost center not found');
      }
    }

    const updated = await this.loansRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      name: request.name?.trim(),
      type: request.type,
      contractNumber: request.contractNumber,
      notes: request.notes,
      endDate: request.endDate,
      interestRate: request.interestRate,
      interestType: request.interestType,
      installmentDay: request.installmentDay,
      bankAccountId: request.bankAccountId,
      costCenterId: request.costCenterId,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Loan not found');
    }

    return { loan: loanToDTO(updated) };
  }
}
