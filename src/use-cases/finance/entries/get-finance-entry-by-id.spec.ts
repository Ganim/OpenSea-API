import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-payments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetFinanceEntryByIdUseCase } from './get-finance-entry-by-id';

let entriesRepository: InMemoryFinanceEntriesRepository;
let paymentsRepository: InMemoryFinanceEntryPaymentsRepository;
let sut: GetFinanceEntryByIdUseCase;

describe('GetFinanceEntryByIdUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    paymentsRepository = new InMemoryFinanceEntryPaymentsRepository();
    sut = new GetFinanceEntryByIdUseCase(entriesRepository, paymentsRepository);
  });

  it('should get a finance entry by id with payments', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel do escritorio',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await paymentsRepository.create({
      entryId: createdEntry.id.toString(),
      amount: 2500,
      paidAt: new Date('2026-02-15'),
      method: 'PIX',
      notes: 'Pagamento parcial',
    });

    await paymentsRepository.create({
      entryId: createdEntry.id.toString(),
      amount: 2500,
      paidAt: new Date('2026-02-20'),
      method: 'BANK_TRANSFER',
    });

    const result = await sut.execute({
      id: createdEntry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.entry.id.toString()).toBe(createdEntry.id.toString());
    expect(result.entry.description).toBe('Aluguel do escritorio');
    expect(result.payments).toHaveLength(2);
    expect(result.payments[0].amount).toBe(2500);
    expect(result.payments[1].amount).toBe(2500);
  });

  it('should return entry with empty payments array', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda sem pagamento',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      id: createdEntry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.entry.id.toString()).toBe(createdEntry.id.toString());
    expect(result.payments).toHaveLength(0);
  });

  it('should not get non-existent entry', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
