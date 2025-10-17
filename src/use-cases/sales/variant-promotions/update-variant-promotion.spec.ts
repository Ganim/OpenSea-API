import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountType } from '@/entities/sales/value-objects/discount-type';
import { VariantPromotion } from '@/entities/sales/variant-promotion';
import { InMemoryVariantPromotionsRepository } from '@/repositories/sales/in-memory/in-memory-variant-promotions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateVariantPromotionUseCase } from './update-variant-promotion';

let repository: InMemoryVariantPromotionsRepository;
let sut: UpdateVariantPromotionUseCase;
let promotion: VariantPromotion;

describe('UpdateVariantPromotionUseCase', () => {
  beforeEach(async () => {
    repository = new InMemoryVariantPromotionsRepository();
    sut = new UpdateVariantPromotionUseCase(repository);

    promotion = await repository.create({
      variantId: new UniqueEntityID(),
      name: 'Original Promotion',
      discountType: DiscountType.create('PERCENTAGE'),
      discountValue: 20,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      notes: 'Original notes',
    });
  });

  it('should be able to update promotion name', async () => {
    const result = await sut.execute({
      id: promotion.id.toString(),
      name: 'Updated Promotion',
    });

    expect(result.promotion.name).toBe('Updated Promotion');
  });

  it('should be able to update discount value', async () => {
    const result = await sut.execute({
      id: promotion.id.toString(),
      discountValue: 30,
    });

    expect(result.promotion.discountValue).toBe(30);
  });

  it('should be able to update dates', async () => {
    const newStartDate = new Date('2025-06-01');
    const newEndDate = new Date('2025-12-31');

    const result = await sut.execute({
      id: promotion.id.toString(),
      startDate: newStartDate,
      endDate: newEndDate,
    });

    expect(result.promotion.startDate).toEqual(newStartDate);
    expect(result.promotion.endDate).toEqual(newEndDate);
  });

  it('should be able to update isActive', async () => {
    const result = await sut.execute({
      id: promotion.id.toString(),
      isActive: false,
    });

    expect(result.promotion.isActive).toBe(false);
  });

  it('should be able to update notes', async () => {
    const result = await sut.execute({
      id: promotion.id.toString(),
      notes: 'Updated notes',
    });

    expect(result.promotion.notes).toBe('Updated notes');
  });

  it('should not update with empty name', async () => {
    await expect(() =>
      sut.execute({
        id: promotion.id.toString(),
        name: '   ',
      }),
    ).rejects.toThrow('Name is required');
  });

  it('should not update with name exceeding 100 characters', async () => {
    const longName = 'A'.repeat(101);

    await expect(() =>
      sut.execute({
        id: promotion.id.toString(),
        name: longName,
      }),
    ).rejects.toThrow('Name must not exceed 100 characters');
  });

  it('should not update with negative discount value', async () => {
    await expect(() =>
      sut.execute({
        id: promotion.id.toString(),
        discountValue: -10,
      }),
    ).rejects.toThrow('Discount value cannot be negative');
  });

  it('should not update percentage discount exceeding 100', async () => {
    await expect(() =>
      sut.execute({
        id: promotion.id.toString(),
        discountValue: 150,
      }),
    ).rejects.toThrow('Percentage discount cannot exceed 100%');
  });

  it('should not update nonexistent promotion', async () => {
    await expect(() =>
      sut.execute({
        id: 'nonexistent-id',
        name: 'Updated',
      }),
    ).rejects.toThrow('Promotion not found');
  });

  it('should be able to update multiple fields at once', async () => {
    const result = await sut.execute({
      id: promotion.id.toString(),
      name: 'Mega Sale',
      discountValue: 50,
      isActive: false,
      notes: 'Big discount',
    });

    expect(result.promotion.name).toBe('Mega Sale');
    expect(result.promotion.discountValue).toBe(50);
    expect(result.promotion.isActive).toBe(false);
    expect(result.promotion.notes).toBe('Big discount');
  });
});
