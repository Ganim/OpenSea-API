import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListVariantsByProductIdUseCase } from './list-variants-by-product-id';

let variantsRepository: InMemoryVariantsRepository;
let sut: ListVariantsByProductIdUseCase;

describe('ListVariantsByProductIdUseCase', () => {
  beforeEach(() => {
    variantsRepository = new InMemoryVariantsRepository();
    sut = new ListVariantsByProductIdUseCase(variantsRepository);
  });

  it('should list variants by product id with aggregations', async () => {
    // Create a variant for testing
    const productId = new UniqueEntityID();
    await variantsRepository.create({
      productId,
      sku: 'SKU001',
      name: 'Test Variant',
      price: 100,
      attributes: { color: 'red' },
    });

    const result = await sut.execute({
      productId: productId.toString(),
    });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]).toEqual(
      expect.objectContaining({
        variant: expect.objectContaining({
          id: expect.any(Object), // UniqueEntityID
          productId: productId,
          sku: 'SKU001',
          name: 'Test Variant',
          price: 100,
          attributes: { color: 'red' },
        }),
        productCode: 'PROD001',
        productName: 'Mock Product',
        itemCount: 5,
        totalCurrentQuantity: 100,
      }),
    );
  });

  it('should return empty array when product has no variants', async () => {
    const result = await sut.execute({
      productId: 'non-existent-product',
    });

    expect(result.variants).toHaveLength(0);
  });
});
