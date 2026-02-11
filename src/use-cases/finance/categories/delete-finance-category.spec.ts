import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteFinanceCategoryUseCase } from './delete-finance-category';

let repository: InMemoryFinanceCategoriesRepository;
let sut: DeleteFinanceCategoryUseCase;

describe('DeleteFinanceCategoryUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryFinanceCategoriesRepository();
    sut = new DeleteFinanceCategoryUseCase(repository);
  });

  it('should delete a finance category', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      id: category.id.toString(),
    });

    const deletedCategory = await repository.findById(category.id, 'tenant-1');

    expect(deletedCategory).toBeNull();
  });

  it('should throw ResourceNotFoundError if category not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
