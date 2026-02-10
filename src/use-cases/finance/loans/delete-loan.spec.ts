import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteLoanUseCase } from './delete-loan';

let loansRepository: InMemoryLoansRepository;
let sut: DeleteLoanUseCase;

let seededLoanId: string;

describe('DeleteLoanUseCase', () => {
  beforeEach(async () => {
    loansRepository = new InMemoryLoansRepository();
    sut = new DeleteLoanUseCase(loansRepository);

    const loan = await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Emprestimo para deletar',
      type: 'PERSONAL',
      principalAmount: 5000,
      outstandingBalance: 5000,
      interestRate: 8,
      startDate: new Date('2026-01-01'),
      totalInstallments: 6,
    });
    seededLoanId = loan.id.toString();
  });

  it('should soft delete a loan', async () => {
    await sut.execute({ tenantId: 'tenant-1', id: seededLoanId });

    const deletedLoan = loansRepository.items.find(
      (i) => i.id.toString() === seededLoanId,
    );
    expect(deletedLoan?.deletedAt).toBeDefined();
  });

  it('should not delete a non-existent loan', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
