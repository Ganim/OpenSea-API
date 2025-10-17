import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { InMemoryVariantPromotionsRepository } from '@/repositories/sales/in-memory/in-memory-variant-promotions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListVariantPromotionsUseCase } from './list-variant-promotions';

let repository: InMemoryVariantPromotionsRepository;
let sut: ListVariantPromotionsUseCase;

describe('ListVariantPromotionsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryVariantPromotionsRepository();
    sut = new ListVariantPromotionsUseCase(repository);
  });

  it('should list promotions by variant', async () => {
    const variantId = new UniqueEntityID();

    await repository.create({
      variantId,
      name: 'Promo 1',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    });

    await repository.create({
      variantId,
      name: 'Promo 2',
      discountType: DiscountType.create('FIXED_AMOUNT'),
      discountValue: 50,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: false,
    });

    await repository.create({
      variantId: new UniqueEntityID(),
      name: 'Other Promo',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 15,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    });

    const result = await sut.execute({
      variantId: variantId.toString(),
    });

    expect(result.promotions).toHaveLength(2);
  });

  it('should list only active promotions', async () => {
    const variantId = new UniqueEntityID();

    await repository.create({
      variantId,
      name: 'Active Promo',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    });

    await repository.create({
      variantId,
      name: 'Inactive Promo',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 20,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: false,
    });

    const result = await sut.execute({
      variantId: variantId.toString(),
      activeOnly: true,
    });

    expect(result.promotions).toHaveLength(1);
    expect(result.promotions[0].name).toBe('Active Promo');
  });

  it('should return empty array when no filters provided', async () => {
    await repository.create({
      variantId: new UniqueEntityID(),
      name: 'Some Promo',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    });

    const result = await sut.execute({});

    expect(result.promotions).toEqual([]);
  });
});
