import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { InMemoryLoanInstallmentsRepository } from '@/repositories/finance/in-memory/in-memory-loan-installments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterLoanPaymentUseCase } from './register-loan-payment';

let loansRepository: InMemoryLoansRepository;
let installmentsRepository: InMemoryLoanInstallmentsRepository;
let sut: RegisterLoanPaymentUseCase;

let seededLoanId: string;
let seededInstallmentId: string;

describe('RegisterLoanPaymentUseCase', () => {
  beforeEach(async () => {
    loansRepository = new InMemoryLoansRepository();
    installmentsRepository = new InMemoryLoanInstallmentsRepository();
    sut = new RegisterLoanPaymentUseCase(
      loansRepository,
      installmentsRepository,
    );

    const loan = await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Emprestimo para pagamento',
      type: 'PERSONAL',
      principalAmount: 2000,
      outstandingBalance: 2000,
      interestRate: 0,
      startDate: new Date('2026-01-01'),
      totalInstallments: 2,
    });
    seededLoanId = loan.id.toString();

    const installment = await installmentsRepository.create({
      loanId: seededLoanId,
      installmentNumber: 1,
      dueDate: new Date('2026-02-01'),
      principalAmount: 1000,
      interestAmount: 0,
      totalAmount: 1000,
    });
    seededInstallmentId = installment.id.toString();

    await installmentsRepository.create({
      loanId: seededLoanId,
      installmentNumber: 2,
      dueDate: new Date('2026-03-01'),
      principalAmount: 1000,
      interestAmount: 0,
      totalAmount: 1000,
    });
  });

  it('should register a payment and update loan balance', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      loanId: seededLoanId,
      installmentId: seededInstallmentId,
      amount: 1000,
      paidAt: new Date('2026-02-01'),
    });

    expect(result.installment.status).toBe('PAID');
    expect(result.installment.paidAmount).toBe(1000);
    expect(result.loan.outstandingBalance).toBe(1000);
    expect(result.loan.paidInstallments).toBe(1);
    expect(result.loan.status).toBe('ACTIVE');
  });

  it('should mark loan as PAID_OFF when last installment is paid', async () => {
    // Pay first installment
    await sut.execute({
      tenantId: 'tenant-1',
      loanId: seededLoanId,
      installmentId: seededInstallmentId,
      amount: 1000,
      paidAt: new Date('2026-02-01'),
    });

    // Pay second installment
    const secondInstallment = installmentsRepository.items.find(
      (i) => i.installmentNumber === 2,
    );
    const result = await sut.execute({
      tenantId: 'tenant-1',
      loanId: seededLoanId,
      installmentId: secondInstallment!.id.toString(),
      amount: 1000,
      paidAt: new Date('2026-03-01'),
    });

    expect(result.loan.status).toBe('PAID_OFF');
    expect(result.loan.paidInstallments).toBe(2);
    expect(result.loan.outstandingBalance).toBe(0);
  });

  it('should not pay an already paid installment', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      loanId: seededLoanId,
      installmentId: seededInstallmentId,
      amount: 1000,
      paidAt: new Date('2026-02-01'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        loanId: seededLoanId,
        installmentId: seededInstallmentId,
        amount: 1000,
        paidAt: new Date('2026-02-01'),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not pay installment for non-existent loan', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        loanId: 'non-existent-loan-id',
        installmentId: seededInstallmentId,
        amount: 1000,
        paidAt: new Date('2026-02-01'),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  // Regression: P1-03 — payments above the installment's total due used to be
  // silently clipped. We now reject them so data-entry errors surface.
  it('should reject a payment greater than the installment total due', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        loanId: seededLoanId,
        installmentId: seededInstallmentId,
        amount: 1500, // installment totalAmount is 1000
        paidAt: new Date('2026-02-01'),
      }),
    ).rejects.toThrowError(/excede valor da parcela/);

    const installment = installmentsRepository.items.find(
      (i) => i.id.toString() === seededInstallmentId,
    );
    expect(installment!.status).toBe('PENDING');
    expect(installment!.paidAmount).toBeUndefined();
  });

  // Regression: P1-03 — partial payments must NOT mark the installment as PAID
  // and must not increment the loan's paidInstallments counter.
  it('should keep installment PENDING and not increment counter on partial payment', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      loanId: seededLoanId,
      installmentId: seededInstallmentId,
      amount: 400, // less than totalAmount (1000)
      paidAt: new Date('2026-02-01'),
    });

    expect(result.installment.status).toBe('PENDING');
    expect(result.installment.paidAmount).toBe(400);
    expect(result.loan.paidInstallments).toBe(0);
    expect(result.loan.outstandingBalance).toBe(1600);
    expect(result.loan.status).toBe('ACTIVE');
  });
});
