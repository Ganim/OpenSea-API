import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetFinanceCategoryByIdUseCase } from './get-finance-category-by-id';

let repository: InMemoryFinanceCategoriesRepository;
let sut: GetFinanceCategoryByIdUseCase;

describe('GetFinanceCategoryByIdUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryFinanceCategoriesRepository();
    sut = new GetFinanceCategoryByIdUseCase(repository);
  });

  it('should get a finance category by id', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: category.id.toString(),
    });

    expect(result.category).toEqual(
      expect.objectContaining({
        id: category.id.toString(),
        name: 'Aluguel',
        slug: 'aluguel',
        type: 'EXPENSE',
      }),
    );
  });

  it('should throw ResourceNotFoundError if category not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
