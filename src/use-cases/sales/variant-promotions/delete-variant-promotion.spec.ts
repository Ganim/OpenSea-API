import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { InMemoryVariantPromotionsRepository } from '@/repositories/sales/in-memory/in-memory-variant-promotions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteVariantPromotionUseCase } from './delete-variant-promotion';

let repository: InMemoryVariantPromotionsRepository;
let sut: DeleteVariantPromotionUseCase;

describe('DeleteVariantPromotionUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryVariantPromotionsRepository();
    sut = new DeleteVariantPromotionUseCase(repository);
  });

  it('should be able to soft delete a promotion', async () => {
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

    expect(result.promotion.isDeleted).toBe(true);
    expect(result.promotion.isActive).toBe(false);
  });

  it('should not be able to delete nonexistent promotion', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent-id',
      }),
    ).rejects.toThrow('Promotion not found');
  });
});
