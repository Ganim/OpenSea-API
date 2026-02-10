import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateLoanUseCase } from './update-loan';

let loansRepository: InMemoryLoansRepository;
let sut: UpdateLoanUseCase;

let seededLoanId: string;

describe('UpdateLoanUseCase', () => {
  beforeEach(async () => {
    loansRepository = new InMemoryLoansRepository();
    sut = new UpdateLoanUseCase(loansRepository);

    const loan = await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Emprestimo Original',
      type: 'PERSONAL',
      principalAmount: 10000,
      outstandingBalance: 10000,
      interestRate: 10,
      startDate: new Date('2026-01-01'),
      totalInstallments: 12,
    });
    seededLoanId = loan.id.toString();
  });

  it('should update loan name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededLoanId,
      name: 'Emprestimo Atualizado',
    });

    expect(result.loan.name).toBe('Emprestimo Atualizado');
  });

  it('should not update a non-existent loan', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        name: 'Teste',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: seededLoanId,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
