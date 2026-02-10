import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { InMemoryLoanInstallmentsRepository } from '@/repositories/finance/in-memory/in-memory-loan-installments-repository';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLoanUseCase } from './create-loan';

let loansRepository: InMemoryLoansRepository;
let installmentsRepository: InMemoryLoanInstallmentsRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let sut: CreateLoanUseCase;

let seededBankAccountId: string;
let seededCostCenterId: string;

describe('CreateLoanUseCase', () => {
  beforeEach(async () => {
    loansRepository = new InMemoryLoansRepository();
    installmentsRepository = new InMemoryLoanInstallmentsRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    sut = new CreateLoanUseCase(
      loansRepository,
      installmentsRepository,
      bankAccountsRepository,
      costCentersRepository,
    );

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '56789',
      accountType: 'CHECKING',
    });
    seededBankAccountId = bankAccount.id.toString();

    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Administrativo',
    });
    seededCostCenterId = costCenter.id.toString();
  });

  it('should create a loan with auto-generated installments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Emprestimo Banco do Brasil',
      type: 'PERSONAL',
      principalAmount: 12000,
      interestRate: 12, // 12% annual = 1% monthly
      startDate: new Date('2026-01-01'),
      totalInstallments: 12,
    });

    expect(result.loan).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Emprestimo Banco do Brasil',
        type: 'PERSONAL',
        status: 'ACTIVE',
        principalAmount: 12000,
        outstandingBalance: 12000,
        interestRate: 12,
        totalInstallments: 12,
        paidInstallments: 0,
      }),
    );

    expect(result.installments).toHaveLength(12);
    expect(result.installments[0].installmentNumber).toBe(1);
    expect(result.installments[11].installmentNumber).toBe(12);

    // Verify each installment has principal + interest = total
    for (const inst of result.installments) {
      const sum = inst.principalAmount + inst.interestAmount;
      expect(Math.abs(sum - inst.totalAmount)).toBeLessThan(0.02); // rounding tolerance
    }
  });

  it('should create a zero-interest loan', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Emprestimo sem juros',
      type: 'BUSINESS',
      principalAmount: 6000,
      interestRate: 0,
      startDate: new Date('2026-01-01'),
      totalInstallments: 6,
    });

    expect(result.installments).toHaveLength(6);
    // Each installment should be 1000 with no interest
    for (const inst of result.installments) {
      expect(inst.principalAmount).toBe(1000);
      expect(inst.interestAmount).toBe(0);
      expect(inst.totalAmount).toBe(1000);
    }
  });

  it('should not create with non-existent bank account', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: 'non-existent-id',
        costCenterId: seededCostCenterId,
        name: 'Emprestimo invalido',
        type: 'PERSONAL',
        principalAmount: 10000,
        interestRate: 10,
        startDate: new Date('2026-01-01'),
        totalInstallments: 12,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with non-existent cost center', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        bankAccountId: seededBankAccountId,
        costCenterId: 'non-existent-id',
        name: 'Emprestimo invalido',
        type: 'PERSONAL',
        principalAmount: 10000,
        interestRate: 10,
        startDate: new Date('2026-01-01'),
        totalInstallments: 12,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
