import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Variant } from '@/entities/stock/variant';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryVariantPromotionsRepository } from '@/repositories/sales/in-memory/in-memory-variant-promotions-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateVariantPromotionUseCase } from './create-variant-promotion';

let variantPromotionsRepository: InMemoryVariantPromotionsRepository;
let variantsRepository: InMemoryVariantsRepository;
let sut: CreateVariantPromotionUseCase;
let variant: Variant;

describe('CreateVariantPromotionUseCase', () => {
  beforeEach(async () => {
    variantPromotionsRepository = new InMemoryVariantPromotionsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    sut = new CreateVariantPromotionUseCase(
      variantPromotionsRepository,
      variantsRepository,
    );

    // Create a test variant using repository
    variant = await variantsRepository.create({
      tenantId: 'tenant-1',
      productId: new UniqueEntityID(),
      slug: Slug.createFromText('test-variant'),
      fullCode: '001.001.0001.001',
      sequentialCode: 1,
      sku: 'TEST-001-M',
      name: 'Test Variant',
      price: 100,
      attributes: {},
    });
  });

  it('should be able to create a variant promotion with percentage discount', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: variant.id.toString(),
      name: 'Summer Sale',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      startDate,
      endDate,
      isActive: true,
      notes: 'Limited time offer',
    });

    expect(result.promotion).toBeDefined();
    expect(result.promotion.name).toBe('Summer Sale');
    expect(result.promotion.discountType).toBe('PERCENTAGE');
    expect(result.promotion.discountValue).toBe(20);
    expect(result.promotion.isActive).toBe(true);
    expect(result.promotion.notes).toBe('Limited time offer');
  });

  it('should be able to create a variant promotion with fixed discount', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: variant.id.toString(),
      name: 'Fixed Discount',
      discountType: 'FIXED_AMOUNT',
      discountValue: 25,
      startDate,
      endDate,
    });

    expect(result.promotion).toBeDefined();
    expect(result.promotion.discountType).toBe('FIXED_AMOUNT');
    expect(result.promotion.discountValue).toBe(25);
    expect(result.promotion.isActive).toBe(true); // Default
  });

  it('should not create promotion with empty name', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        variantId: variant.id.toString(),
        name: '   ',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      }),
    ).rejects.toThrow('Name is required');
  });

  it('should not create promotion with name exceeding 100 characters', async () => {
    const longName = 'A'.repeat(101);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        variantId: variant.id.toString(),
        name: longName,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      }),
    ).rejects.toThrow('Name must not exceed 100 characters');
  });

  it('should not create promotion with invalid discount type', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        variantId: variant.id.toString(),
        name: 'Invalid Discount',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discountType: 'INVALID' as any,
        discountValue: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      }),
    ).rejects.toThrow(
      'Discount type must be either PERCENTAGE or FIXED_AMOUNT',
    );
  });

  it('should not create promotion with negative discount value', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        variantId: variant.id.toString(),
        name: 'Negative Discount',
        discountType: 'PERCENTAGE',
        discountValue: -10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      }),
    ).rejects.toThrow('Discount value cannot be negative');
  });

  it('should not create promotion with percentage exceeding 100', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        variantId: variant.id.toString(),
        name: 'Over 100%',
        discountType: 'PERCENTAGE',
        discountValue: 150,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      }),
    ).rejects.toThrow('Percentage discount cannot exceed 100%');
  });

  it('should not create promotion with start date after end date', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        variantId: variant.id.toString(),
        name: 'Invalid Dates',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
      }),
    ).rejects.toThrow('Start date must be before end date');
  });

  it('should not create promotion for nonexistent variant', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        variantId: 'nonexistent-id',
        name: 'Nonexistent Variant',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      }),
    ).rejects.toThrow('Variant not found');
  });

  it('should trim name and notes when creating promotion', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      variantId: variant.id.toString(),
      name: '  Trimmed Name  ',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      notes: '  Trimmed Notes  ',
    });

    expect(result.promotion.name).toBe('Trimmed Name');
    expect(result.promotion.notes).toBe('Trimmed Notes');
  });
});
