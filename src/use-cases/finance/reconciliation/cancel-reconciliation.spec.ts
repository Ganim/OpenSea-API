import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankReconciliationsRepository } from '@/repositories/finance/in-memory/in-memory-bank-reconciliations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelReconciliationUseCase } from './cancel-reconciliation';

let reconciliationsRepository: InMemoryBankReconciliationsRepository;
let sut: CancelReconciliationUseCase;

describe('CancelReconciliationUseCase', () => {
  beforeEach(() => {
    reconciliationsRepository = new InMemoryBankReconciliationsRepository();
    sut = new CancelReconciliationUseCase(reconciliationsRepository);
  });

  it('should cancel a pending reconciliation', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-15'),
      totalTransactions: 5,
      status: 'PENDING',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      reconciliationId: reconciliation.id.toString(),
    });

    expect(result.reconciliation.status).toBe('CANCELLED');
  });

  it('should reject when reconciliation not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should reject when already completed', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 5,
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject when already cancelled', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 5,
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        reconciliationId: reconciliation.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should isolate across tenants (cannot cancel other tenant reconciliation)', async () => {
    const reconciliation = await reconciliationsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      fileName: 'extrato.ofx',
      periodStart: new Date(),
      periodEnd: new Date(),
      totalTransactions: 5,
      status: 'PENDING',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        reconciliationId: reconciliation.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
