import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type LoanDTO, loanToDTO } from '@/mappers/finance/loan/loan-to-dto';
import {
  type LoanInstallmentDTO,
  loanInstallmentToDTO,
} from '@/mappers/finance/loan-installment/loan-installment-to-dto';
import type { LoansRepository } from '@/repositories/finance/loans-repository';
import type { LoanInstallmentsRepository } from '@/repositories/finance/loan-installments-repository';

interface RegisterLoanPaymentUseCaseRequest {
  tenantId: string;
  loanId: string;
  installmentId: string;
  amount: number;
  paidAt: Date;
  bankAccountId?: string;
}

interface RegisterLoanPaymentUseCaseResponse {
  loan: LoanDTO;
  installment: LoanInstallmentDTO;
}

export class RegisterLoanPaymentUseCase {
  constructor(
    private loansRepository: LoansRepository,
    private loanInstallmentsRepository: LoanInstallmentsRepository,
  ) {}

  async execute(
    request: RegisterLoanPaymentUseCaseRequest,
  ): Promise<RegisterLoanPaymentUseCaseResponse> {
    const { tenantId, loanId, installmentId, amount, paidAt, bankAccountId } =
      request;

    // Validate loan exists
    const loan = await this.loansRepository.findById(
      new UniqueEntityID(loanId),
      tenantId,
    );
    if (!loan) {
      throw new ResourceNotFoundError('Loan not found');
    }

    if (loan.status !== 'ACTIVE') {
      throw new BadRequestError('Loan is not active');
    }

    // Validate installment exists
    const installment = await this.loanInstallmentsRepository.findById(
      new UniqueEntityID(installmentId),
    );
    if (!installment) {
      throw new ResourceNotFoundError('Installment not found');
    }

    if (installment.loanId.toString() !== loanId) {
      throw new BadRequestError('Installment does not belong to this loan');
    }

    if (installment.isPaid) {
      throw new BadRequestError('Installment is already paid');
    }

    if (amount <= 0) {
      throw new BadRequestError('Payment amount must be positive');
    }

    // Update installment
    const updatedInstallment = await this.loanInstallmentsRepository.update({
      id: new UniqueEntityID(installmentId),
      paidAmount: amount,
      paidAt,
      status: 'PAID',
      bankAccountId: bankAccountId ?? null,
    });

    // Update loan outstanding balance and paid installments
    const newOutstandingBalance = Math.max(0, loan.outstandingBalance - amount);
    const newPaidInstallments = loan.paidInstallments + 1;
    const isFullyPaid = newPaidInstallments >= loan.totalInstallments;

    const updatedLoan = await this.loansRepository.update({
      id: new UniqueEntityID(loanId),
      outstandingBalance: newOutstandingBalance,
      paidInstallments: newPaidInstallments,
      ...(isFullyPaid && { status: 'PAID_OFF' }),
    });

    return {
      loan: loanToDTO(updatedLoan!),
      installment: loanInstallmentToDTO(updatedInstallment!),
    };
  }
}
