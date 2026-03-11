import { CannotDeletePaidEntryError } from '@/@errors/use-cases/cannot-delete-paid-entry-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteFinanceEntryUseCase } from './delete-finance-entry';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: DeleteFinanceEntryUseCase;

describe('DeleteFinanceEntryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new DeleteFinanceEntryUseCase(entriesRepository);
  });

  it('should delete a finance entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta a excluir',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await sut.execute({
      id: createdEntry.id.toString(),
      tenantId: 'tenant-1',
    });

    const deletedEntry = await entriesRepository.findById(
      createdEntry.id,
      'tenant-1',
    );

    expect(deletedEntry).toBeNull();
  });

  it('should not delete non-existent entry', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not delete if status is PAID', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta paga',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'PAID';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(CannotDeletePaidEntryError);
  });

  it('should not delete if status is RECEIVED', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Recebimento concluido',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 8000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'RECEIVED';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(CannotDeletePaidEntryError);
  });

  it('should include status in error message for PAID entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta paga',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'PAID';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow('Cannot delete an entry with status PAID');
  });
});
