import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { InMemoryLoanInstallmentsRepository } from '@/repositories/finance/in-memory/in-memory-loan-installments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetLoanByIdUseCase } from './get-loan-by-id';

let loansRepository: InMemoryLoansRepository;
let installmentsRepository: InMemoryLoanInstallmentsRepository;
let sut: GetLoanByIdUseCase;

let seededLoanId: string;

describe('GetLoanByIdUseCase', () => {
  beforeEach(async () => {
    loansRepository = new InMemoryLoansRepository();
    installmentsRepository = new InMemoryLoanInstallmentsRepository();
    sut = new GetLoanByIdUseCase(loansRepository, installmentsRepository);

    const loan = await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Emprestimo Teste',
      type: 'PERSONAL',
      principalAmount: 10000,
      outstandingBalance: 10000,
      interestRate: 12,
      startDate: new Date('2026-01-01'),
      totalInstallments: 12,
    });
    seededLoanId = loan.id.toString();

    // Create some installments
    await installmentsRepository.create({
      loanId: seededLoanId,
      installmentNumber: 1,
      dueDate: new Date('2026-02-01'),
      principalAmount: 800,
      interestAmount: 100,
      totalAmount: 900,
    });
    await installmentsRepository.create({
      loanId: seededLoanId,
      installmentNumber: 2,
      dueDate: new Date('2026-03-01'),
      principalAmount: 810,
      interestAmount: 90,
      totalAmount: 900,
    });
  });

  it('should return loan with installments', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededLoanId,
    });

    expect(result.loan.name).toBe('Emprestimo Teste');
    expect(result.installments).toHaveLength(2);
    expect(result.installments[0].installmentNumber).toBe(1);
    expect(result.installments[1].installmentNumber).toBe(2);
  });

  it('should not find a non-existent loan', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
