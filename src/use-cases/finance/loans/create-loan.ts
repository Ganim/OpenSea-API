import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type LoanDTO, loanToDTO } from '@/mappers/finance/loan/loan-to-dto';
import {
  type LoanInstallmentDTO,
  loanInstallmentToDTO,
} from '@/mappers/finance/loan-installment/loan-installment-to-dto';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { LoansRepository } from '@/repositories/finance/loans-repository';
import type { LoanInstallmentsRepository } from '@/repositories/finance/loan-installments-repository';

interface CreateLoanUseCaseRequest {
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  type: string;
  principalAmount: number;
  interestRate: number;
  interestType?: string;
  startDate: Date;
  totalInstallments: number;
  installmentDay?: number;
  contractNumber?: string;
  notes?: string;
}

interface CreateLoanUseCaseResponse {
  loan: LoanDTO;
  installments: LoanInstallmentDTO[];
}

export class CreateLoanUseCase {
  constructor(
    private loansRepository: LoansRepository,
    private loanInstallmentsRepository: LoanInstallmentsRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private costCentersRepository: CostCentersRepository,
  ) {}

  async execute(
    request: CreateLoanUseCaseRequest,
  ): Promise<CreateLoanUseCaseResponse> {
    const {
      tenantId,
      bankAccountId,
      costCenterId,
      name,
      principalAmount,
      interestRate,
      totalInstallments,
    } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Loan name is required');
    }

    if (principalAmount <= 0) {
      throw new BadRequestError('Principal amount must be positive');
    }

    if (totalInstallments < 1) {
      throw new BadRequestError('Total installments must be at least 1');
    }

    // Validate bank account exists
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(bankAccountId),
      tenantId,
    );
    if (!bankAccount) {
      throw new BadRequestError('Bank account not found');
    }

    // Validate cost center exists
    const costCenter = await this.costCentersRepository.findById(
      new UniqueEntityID(costCenterId),
      tenantId,
    );
    if (!costCenter) {
      throw new BadRequestError('Cost center not found');
    }

    const loan = await this.loansRepository.create({
      tenantId,
      bankAccountId,
      costCenterId,
      name: name.trim(),
      type: request.type,
      contractNumber: request.contractNumber,
      principalAmount,
      outstandingBalance: principalAmount,
      interestRate,
      interestType: request.interestType,
      startDate: request.startDate,
      totalInstallments,
      installmentDay: request.installmentDay,
      notes: request.notes,
    });

    // Generate installments using PMT formula
    const installmentSchemas = this.calculateInstallments(
      loan.id.toString(),
      principalAmount,
      interestRate,
      totalInstallments,
      request.startDate,
      request.installmentDay,
    );

    const installments =
      await this.loanInstallmentsRepository.createMany(installmentSchemas);

    return {
      loan: loanToDTO(loan),
      installments: installments.map(loanInstallmentToDTO),
    };
  }

  private calculateInstallments(
    loanId: string,
    principalAmount: number,
    annualInterestRate: number,
    totalInstallments: number,
    startDate: Date,
    installmentDay?: number,
  ) {
    const monthlyRate = annualInterestRate / 100 / 12;
    let fixedPayment: number;

    if (monthlyRate === 0) {
      fixedPayment = principalAmount / totalInstallments;
    } else {
      // PMT formula: P * r / (1 - (1 + r)^-n)
      fixedPayment =
        (principalAmount * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -totalInstallments));
    }

    const installments = [];
    let remainingBalance = principalAmount;

    for (let i = 1; i <= totalInstallments; i++) {
      const interestAmount = remainingBalance * monthlyRate;
      const installmentPrincipal = fixedPayment - interestAmount;

      // Calculate due date
      const dueDate = new Date(startDate);
      dueDate.setUTCMonth(dueDate.getUTCMonth() + i);
      if (installmentDay) {
        dueDate.setUTCDate(installmentDay);
      }

      installments.push({
        loanId,
        installmentNumber: i,
        dueDate,
        principalAmount: Math.round(installmentPrincipal * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        totalAmount: Math.round(fixedPayment * 100) / 100,
      });

      remainingBalance -= installmentPrincipal;
    }

    return installments;
  }
}
