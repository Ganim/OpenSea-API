import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryProductsRepository } from '@/repositories/stock/in-memory/in-memory-products-repository';
import type { CareCatalogProvider } from '@/services/care';
import { beforeEach, describe, expect, it } from 'vitest';
import { SetProductCareInstructionsUseCase } from './set-product-care-instructions';

let productsRepository: InMemoryProductsRepository;
let sut: SetProductCareInstructionsUseCase;

const mockCareCatalog = {
  validateIds: (ids: string[]) => ids.filter((id) => !id.startsWith('valid-')),
  exists: (id: string) => id.startsWith('valid-'),
  getAll: () => [],
  getById: () => null,
} as unknown as CareCatalogProvider;

describe('SetProductCareInstructionsUseCase', () => {
  beforeEach(() => {
    productsRepository = new InMemoryProductsRepository();
    sut = new SetProductCareInstructionsUseCase(
      productsRepository,
      mockCareCatalog,
    );
  });

  it('should throw BadRequestError for duplicate care instruction IDs', async () => {
    await expect(() =>
      sut.execute({
        productId: 'any',
        careInstructionIds: ['valid-1', 'valid-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError for invalid care instruction IDs', async () => {
    await expect(() =>
      sut.execute({ productId: 'any', careInstructionIds: ['invalid-1'] }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for non-existent product', async () => {
    await expect(() =>
      sut.execute({
        productId: 'non-existent',
        careInstructionIds: ['valid-1'],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
