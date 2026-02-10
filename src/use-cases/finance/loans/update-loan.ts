import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type LoanDTO, loanToDTO } from '@/mappers/finance/loan/loan-to-dto';
import type { LoansRepository } from '@/repositories/finance/loans-repository';

interface UpdateLoanUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  contractNumber?: string | null;
  notes?: string | null;
  endDate?: Date | null;
}

interface UpdateLoanUseCaseResponse {
  loan: LoanDTO;
}

export class UpdateLoanUseCase {
  constructor(private loansRepository: LoansRepository) {}

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

    const updated = await this.loansRepository.update({
      id: new UniqueEntityID(id),
      name: request.name?.trim(),
      contractNumber: request.contractNumber,
      notes: request.notes,
      endDate: request.endDate,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Loan not found');
    }

    return { loan: loanToDTO(updated) };
  }
}
