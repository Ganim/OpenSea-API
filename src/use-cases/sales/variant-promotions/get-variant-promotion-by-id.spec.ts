import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { InMemoryVariantPromotionsRepository } from '@/repositories/sales/in-memory/in-memory-variant-promotions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetVariantPromotionByIdUseCase } from './get-variant-promotion-by-id';

let repository: InMemoryVariantPromotionsRepository;
let sut: GetVariantPromotionByIdUseCase;

describe('GetVariantPromotionByIdUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryVariantPromotionsRepository();
    sut = new GetVariantPromotionByIdUseCase(repository);
  });

  it('should be able to get a promotion by id', async () => {
    const promotion = await repository.create({
      variantId: new UniqueEntityID(),
      name: 'Test Promotion',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 20,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    });

    const result = await sut.execute({
      id: promotion.id.toString(),
    });

    expect(result.promotion).toBeDefined();
    expect(result.promotion.name).toBe('Test Promotion');
  });

  it('should not be able to get nonexistent promotion', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent-id',
      }),
    ).rejects.toThrow('Promotion not found');
  });
});
