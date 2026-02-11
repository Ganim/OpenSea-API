import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateFinanceEntryUseCase } from './update-finance-entry';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: UpdateFinanceEntryUseCase;

describe('UpdateFinanceEntryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new UpdateFinanceEntryUseCase(entriesRepository);
  });

  it('should update a finance entry description', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel antigo',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      id: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      description: 'Aluguel atualizado',
    });

    expect(result.entry.description).toBe('Aluguel atualizado');
  });

  it('should update multiple fields', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta original',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const newDueDate = new Date('2026-03-15');

    const result = await sut.execute({
      id: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      description: 'Conta atualizada',
      expectedAmount: 3500,
      dueDate: newDueDate,
      notes: 'Valor renegociado',
    });

    expect(result.entry.description).toBe('Conta atualizada');
    expect(result.entry.expectedAmount).toBe(3500);
    expect(result.entry.dueDate).toEqual(newDueDate);
    expect(result.entry.notes).toBe('Valor renegociado');
  });

  it('should not update non-existent entry', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: 'tenant-1',
        description: 'Qualquer descricao',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update if status is PAID', async () => {
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
        description: 'Tentativa de alterar conta paga',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update if status is CANCELLED', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta cancelada',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1500,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    entriesRepository.items[0].status = 'CANCELLED';

    await expect(
      sut.execute({
        id: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        description: 'Tentativa de alterar conta cancelada',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
