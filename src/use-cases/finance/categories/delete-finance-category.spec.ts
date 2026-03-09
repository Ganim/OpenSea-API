import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ErrorCodes } from '@/@errors/error-codes';
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

  it('should delete a finance category with no linked entries', async () => {
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

  it('should throw FINANCE_CATEGORY_NOT_FOUND with correct error code', async () => {
    try {
      await sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect((error as ResourceNotFoundError).code).toBe(ErrorCodes.FINANCE_CATEGORY_NOT_FOUND);
    }
  });

  it('should throw IS_SYSTEM error when deleting a system category', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Receita Operacional',
      slug: 'receita-operacional',
      type: 'REVENUE',
      isSystem: true,
    });

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        id: category.id.toString(),
      });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(ErrorCodes.FINANCE_CATEGORY_IS_SYSTEM);
    }
  });

  it('should throw HAS_CHILDREN error when deleting a category with children', async () => {
    const parent = await repository.create({
      tenantId: 'tenant-1',
      name: 'Despesas',
      slug: 'despesas',
      type: 'EXPENSE',
    });

    await repository.create({
      tenantId: 'tenant-1',
      name: 'Pessoal',
      slug: 'pessoal',
      type: 'EXPENSE',
      parentId: parent.id.toString(),
    });

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        id: parent.id.toString(),
      });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(ErrorCodes.FINANCE_CATEGORY_HAS_CHILDREN);
    }
  });

  it('should throw REPLACEMENT_REQUIRED when deleting category with entries and no replacement', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    // Simulate linked entries
    repository.entryCounts.set(category.id.toString(), 5);

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        id: category.id.toString(),
      });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(ErrorCodes.FINANCE_CATEGORY_REPLACEMENT_REQUIRED);
    }
  });

  it('should throw SELF_REPLACEMENT when replacement is the same category', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    repository.entryCounts.set(category.id.toString(), 3);

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        id: category.id.toString(),
        replacementCategoryId: category.id.toString(),
      });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).code).toBe(ErrorCodes.FINANCE_CATEGORY_SELF_REPLACEMENT);
    }
  });

  it('should throw REPLACEMENT_NOT_FOUND when replacement category does not exist', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    repository.entryCounts.set(category.id.toString(), 3);

    try {
      await sut.execute({
        tenantId: 'tenant-1',
        id: category.id.toString(),
        replacementCategoryId: 'non-existent-id',
      });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect((error as ResourceNotFoundError).code).toBe(ErrorCodes.FINANCE_CATEGORY_REPLACEMENT_NOT_FOUND);
    }
  });

  it('should migrate entries and soft-delete when replacement is provided', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    const replacement = await repository.create({
      tenantId: 'tenant-1',
      name: 'Custos Fixos',
      slug: 'custos-fixos',
      type: 'EXPENSE',
    });

    repository.entryCounts.set(category.id.toString(), 5);

    await sut.execute({
      tenantId: 'tenant-1',
      id: category.id.toString(),
      replacementCategoryId: replacement.id.toString(),
    });

    // Category should be soft-deleted
    const deleted = await repository.findById(category.id, 'tenant-1');
    expect(deleted).toBeNull();

    // Entries should have been migrated
    expect(repository.entryMigrations).toHaveLength(1);
    expect(repository.entryMigrations[0]).toEqual({
      from: category.id.toString(),
      to: replacement.id.toString(),
      tenantId: 'tenant-1',
    });
  });

  it('should delete category with no entries even without replacement', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Vazia',
      slug: 'vazia',
      type: 'EXPENSE',
    });

    // No entries linked (default is 0)
    await sut.execute({
      tenantId: 'tenant-1',
      id: category.id.toString(),
    });

    const deleted = await repository.findById(category.id, 'tenant-1');
    expect(deleted).toBeNull();
  });
});
