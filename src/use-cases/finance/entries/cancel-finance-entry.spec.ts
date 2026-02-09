import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelFinanceEntryUseCase } from './cancel-finance-entry';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: CancelFinanceEntryUseCase;

describe('CancelFinanceEntryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new CancelFinanceEntryUseCase(entriesRepository);
  });

  it('should cancel a finance entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta a cancelar',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      id: createdEntry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.entry.status).toBe('CANCELLED');
  });

  it('should not cancel non-existent entry', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not cancel already paid entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta ja paga',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'PAID';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not cancel already received entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recebimento concluido',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    entriesRepository.items[0].status = 'RECEIVED';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
