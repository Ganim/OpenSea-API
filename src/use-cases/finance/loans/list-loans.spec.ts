import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListLoansUseCase } from './list-loans';

let loansRepository: InMemoryLoansRepository;
let sut: ListLoansUseCase;

describe('ListLoansUseCase', () => {
  beforeEach(async () => {
    loansRepository = new InMemoryLoansRepository();
    sut = new ListLoansUseCase(loansRepository);

    // Seed loans
    await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Emprestimo Pessoal',
      type: 'PERSONAL',
      principalAmount: 10000,
      outstandingBalance: 10000,
      interestRate: 12,
      startDate: new Date('2026-01-01'),
      totalInstallments: 12,
    });

    await loansRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Financiamento Equipamento',
      type: 'EQUIPMENT',
      principalAmount: 50000,
      outstandingBalance: 50000,
      interestRate: 8,
      startDate: new Date('2026-01-01'),
      totalInstallments: 48,
    });

    await loansRepository.create({
      tenantId: 'tenant-2',
      bankAccountId: 'bank-2',
      costCenterId: 'cc-2',
      name: 'Outro tenant',
      type: 'PERSONAL',
      principalAmount: 5000,
      outstandingBalance: 5000,
      interestRate: 10,
      startDate: new Date('2026-01-01'),
      totalInstallments: 6,
    });
  });

  it('should list loans for a tenant', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.loans).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('should filter by type', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'EQUIPMENT',
    });

    expect(result.loans).toHaveLength(1);
    expect(result.loans[0].name).toBe('Financiamento Equipamento');
  });

  it('should search by name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      search: 'Pessoal',
    });

    expect(result.loans).toHaveLength(1);
    expect(result.loans[0].name).toBe('Emprestimo Pessoal');
  });
});
