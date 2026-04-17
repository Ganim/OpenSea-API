import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionManager } from '@/lib/transaction-manager';
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
    private transactionManager?: TransactionManager,
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

    // Calculate installments (pure computation, no DB)
    const installmentSchemas = this.calculateInstallments(
      '', // loanId placeholder — will be set after loan creation
      principalAmount,
      interestRate,
      totalInstallments,
      request.startDate,
      request.installmentDay,
    );

    // Wrap loan + installments creation in a transaction
    if (this.transactionManager) {
      return this.transactionManager.run(async (tx) => {
        const loan = await this.loansRepository.create(
          {
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
          },
          tx,
        );

        // Set loanId on all installment schemas
        const schemasWithLoanId = installmentSchemas.map((s) => ({
          ...s,
          loanId: loan.id.toString(),
        }));

        const installments = await this.loanInstallmentsRepository.createMany(
          schemasWithLoanId,
          tx,
        );

        return {
          loan: loanToDTO(loan),
          installments: installments.map(loanInstallmentToDTO),
        };
      });
    }

    // Fallback without transaction (in-memory tests)
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

    const schemasWithLoanId = installmentSchemas.map((s) => ({
      ...s,
      loanId: loan.id.toString(),
    }));

    const installments =
      await this.loanInstallmentsRepository.createMany(schemasWithLoanId);

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

    const baseDay = installmentDay ?? startDate.getUTCDate();

    for (let i = 1; i <= totalInstallments; i++) {
      const interestAmount = remainingBalance * monthlyRate;
      const installmentPrincipal = fixedPayment - interestAmount;

      // Calculate due date by clamping the target day to the last valid day of
      // the target month. Using `setUTCMonth(m + i)` alone overflows (e.g. 31/01
      // + 1 month becomes 03/03 instead of 28/02), producing duplicate months
      // and skipping February entirely. Clamping keeps one installment per month.
      const dueDate = addMonthsClampedUtc(startDate, i, baseDay);

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

/**
 * Returns the last day (1..31) of the given UTC year/month.
 * Day 0 of month+1 equals the last day of month.
 */
function lastDayOfMonthUtc(year: number, monthIndexZeroBased: number): number {
  return new Date(Date.UTC(year, monthIndexZeroBased + 1, 0)).getUTCDate();
}

/**
 * Adds `monthsToAdd` to `startDate`, targeting `targetDay` inside the resulting
 * month. If `targetDay` exceeds the month's last day (e.g. Feb 31 → Feb 28/29),
 * the date is clamped to that last day. Returns a new Date at UTC midnight.
 */
function addMonthsClampedUtc(
  startDate: Date,
  monthsToAdd: number,
  targetDay: number,
): Date {
  const targetYearRaw = startDate.getUTCFullYear();
  const targetMonthRaw = startDate.getUTCMonth() + monthsToAdd;
  const targetYear = targetYearRaw + Math.floor(targetMonthRaw / 12);
  const targetMonth = ((targetMonthRaw % 12) + 12) % 12;

  const maxDay = lastDayOfMonthUtc(targetYear, targetMonth);
  const clampedDay = Math.min(targetDay, maxDay);

  return new Date(Date.UTC(targetYear, targetMonth, clampedDay));
}
