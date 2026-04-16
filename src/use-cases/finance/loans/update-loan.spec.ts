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

  it('should update interest rate, type and amortization system', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededLoanId,
      type: 'BUSINESS',
      interestRate: 15.5,
      interestType: 'SAC',
      installmentDay: 10,
    });

    expect(result.loan.type).toBe('BUSINESS');
    expect(result.loan.interestRate).toBe(15.5);
    expect(result.loan.interestType).toBe('SAC');
    expect(result.loan.installmentDay).toBe(10);
  });

  it('should block structural changes when there are paid installments', async () => {
    const loan = loansRepository.items.find(
      (i) => i.id.toString() === seededLoanId,
    )!;
    loan.paidInstallments = 1;

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: seededLoanId,
        interestRate: 20,
      }),
    ).rejects.toThrow(/paid installments/i);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: seededLoanId,
        interestType: 'SAC',
      }),
    ).rejects.toThrow(/paid installments/i);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: seededLoanId,
        installmentDay: 5,
      }),
    ).rejects.toThrow(/paid installments/i);
  });

  it('should still allow non-structural edits when there are paid installments', async () => {
    const loan = loansRepository.items.find(
      (i) => i.id.toString() === seededLoanId,
    )!;
    loan.paidInstallments = 1;

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: seededLoanId,
      name: 'Apelido Atualizado',
      contractNumber: 'CT-XYZ',
      notes: 'Renegociado em 2026',
    });

    expect(result.loan.name).toBe('Apelido Atualizado');
    expect(result.loan.contractNumber).toBe('CT-XYZ');
    expect(result.loan.notes).toBe('Renegociado em 2026');
  });
});
