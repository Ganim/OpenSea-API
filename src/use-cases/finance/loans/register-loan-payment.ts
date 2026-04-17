import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionManager } from '@/lib/transaction-manager';
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
    private transactionManager?: TransactionManager,
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

    // Reject overpayments. A single payment attempt must not exceed the
    // installment's total due — callers must either split the payment or
    // choose a later installment. Silently clipping the value (as the prior
    // implementation did) hides data-entry errors.
    const installmentTotalDue = installment.totalAmount;
    const epsilon = 0.005; // half-cent tolerance for float rounding
    if (amount > installmentTotalDue + epsilon) {
      throw new BadRequestError('Pagamento excede valor da parcela');
    }

    // A full payment closes the installment (→ PAID) and counts toward
    // the loan's paidInstallments counter. A partial payment leaves the
    // installment PENDING with paidAmount tracking the amount applied so
    // far; the loan counter is not incremented.
    // The domain type InstallmentStatus currently lacks a PARTIALLY_PAID
    // value (see src/entities/finance/finance-entry-types.ts). Until it is
    // extended, partial payments keep status PENDING.
    const isFullPayment = amount >= installmentTotalDue - epsilon;
    const installmentStatus = isFullPayment ? 'PAID' : 'PENDING';

    const newOutstandingBalance = Math.max(0, loan.outstandingBalance - amount);
    const newPaidInstallments = isFullPayment
      ? loan.paidInstallments + 1
      : loan.paidInstallments;
    const isFullyPaid =
      isFullPayment && newPaidInstallments >= loan.totalInstallments;

    // Wrap installment update + loan update in a transaction
    if (this.transactionManager) {
      return this.transactionManager.run(async (tx) => {
        const updatedInstallment = await this.loanInstallmentsRepository.update(
          {
            id: new UniqueEntityID(installmentId),
            paidAmount: amount,
            paidAt,
            status: installmentStatus,
            bankAccountId: bankAccountId ?? null,
          },
          tx,
        );

        const updatedLoan = await this.loansRepository.update(
          {
            id: new UniqueEntityID(loanId),
            tenantId,
            outstandingBalance: newOutstandingBalance,
            paidInstallments: newPaidInstallments,
            ...(isFullyPaid && { status: 'PAID_OFF' }),
          },
          tx,
        );

        return {
          loan: loanToDTO(updatedLoan!),
          installment: loanInstallmentToDTO(updatedInstallment!),
        };
      });
    }

    // Fallback without transaction (in-memory tests)
    const updatedInstallment = await this.loanInstallmentsRepository.update({
      id: new UniqueEntityID(installmentId),
      paidAmount: amount,
      paidAt,
      status: installmentStatus,
      bankAccountId: bankAccountId ?? null,
    });

    const updatedLoan = await this.loansRepository.update({
      id: new UniqueEntityID(loanId),
      tenantId,
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
