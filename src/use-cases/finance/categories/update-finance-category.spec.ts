import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateFinanceCategoryUseCase } from './update-finance-category';

let repository: InMemoryFinanceCategoriesRepository;
let sut: UpdateFinanceCategoryUseCase;

describe('UpdateFinanceCategoryUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryFinanceCategoriesRepository();
    sut = new UpdateFinanceCategoryUseCase(repository);
  });

  it('should update a finance category name', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: category.id.toString(),
      name: 'Aluguel Atualizado',
    });

    expect(result.category).toBeDefined();
    expect(result.category.name).toBe('Aluguel Atualizado');
    expect(result.category.id).toBe(category.id.toString());
  });

  it('should throw ResourceNotFoundError if category not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError if name is empty', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: category.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError if invalid type', async () => {
    const category = await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: category.id.toString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'INVALID_TYPE' as any,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError if duplicate slug', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      name: 'Aluguel',
      slug: 'aluguel',
      type: 'EXPENSE',
    });

    const category2 = await repository.create({
      tenantId: 'tenant-1',
      name: 'Vendas',
      slug: 'vendas',
      type: 'REVENUE',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: category2.id.toString(),
        slug: 'aluguel',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
