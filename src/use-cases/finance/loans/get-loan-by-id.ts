import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type LoanDTO, loanToDTO } from '@/mappers/finance/loan/loan-to-dto';
import {
  type LoanInstallmentDTO,
  loanInstallmentToDTO,
} from '@/mappers/finance/loan-installment/loan-installment-to-dto';
import type { LoansRepository } from '@/repositories/finance/loans-repository';
import type { LoanInstallmentsRepository } from '@/repositories/finance/loan-installments-repository';

interface GetLoanByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetLoanByIdUseCaseResponse {
  loan: LoanDTO;
  installments: LoanInstallmentDTO[];
}

export class GetLoanByIdUseCase {
  constructor(
    private loansRepository: LoansRepository,
    private loanInstallmentsRepository: LoanInstallmentsRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: GetLoanByIdUseCaseRequest): Promise<GetLoanByIdUseCaseResponse> {
    const loan = await this.loansRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!loan) {
      throw new ResourceNotFoundError('Loan not found');
    }

    const installments = await this.loanInstallmentsRepository.findByLoanId(
      new UniqueEntityID(id),
    );

    return {
      loan: loanToDTO(loan),
      installments: installments.map(loanInstallmentToDTO),
    };
  }
}
