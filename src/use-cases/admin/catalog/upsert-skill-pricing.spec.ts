import { InMemorySkillPricingRepository } from '@/repositories/core/in-memory/in-memory-skill-pricing-repository';
import { InMemorySystemSkillDefinitionsRepository } from '@/repositories/core/in-memory/in-memory-system-skill-definitions-repository';
import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { SkillPricing } from '@/entities/core/skill-pricing';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpsertSkillPricingUseCase } from './upsert-skill-pricing';

let skillDefinitionsRepository: InMemorySystemSkillDefinitionsRepository;
let skillPricingRepository: InMemorySkillPricingRepository;
let sut: UpsertSkillPricingUseCase;

describe('UpsertSkillPricingUseCase', () => {
  beforeEach(() => {
    skillDefinitionsRepository = new InMemorySystemSkillDefinitionsRepository();
    skillPricingRepository = new InMemorySkillPricingRepository();
    sut = new UpsertSkillPricingUseCase(
      skillDefinitionsRepository,
      skillPricingRepository,
    );
  });

  // OBJECTIVE — FLAT pricing
  it('should create FLAT pricing for a skill', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    const { pricing } = await sut.execute({
      skillCode: 'stock.products',
      pricingType: 'FLAT',
      flatPrice: 49.9,
    });

    expect(pricing.skillCode).toBe('stock.products');
    expect(pricing.pricingType).toBe('FLAT');
    expect(pricing.flatPrice).toBe(49.9);
  });

  // OBJECTIVE — PER_UNIT pricing
  it('should create PER_UNIT pricing for a skill', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.warehouses',
        name: 'Warehouses',
        category: 'MODULE',
      }),
    );

    const { pricing } = await sut.execute({
      skillCode: 'stock.warehouses',
      pricingType: 'PER_UNIT',
      unitPrice: 9.9,
      unitMetric: 'warehouse',
      unitMetricLabel: 'per warehouse',
    });

    expect(pricing.pricingType).toBe('PER_UNIT');
    expect(pricing.unitPrice).toBe(9.9);
    expect(pricing.unitMetric).toBe('warehouse');
    expect(pricing.unitMetricLabel).toBe('per warehouse');
  });

  // OBJECTIVE — USAGE pricing
  it('should create USAGE pricing for a skill', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'storage.files',
        name: 'File Storage',
        category: 'MODULE',
      }),
    );

    const { pricing } = await sut.execute({
      skillCode: 'storage.files',
      pricingType: 'USAGE',
      usageIncluded: 1000,
      usagePrice: 0.05,
      usageMetric: 'MB',
      usageMetricLabel: 'per MB',
    });

    expect(pricing.pricingType).toBe('USAGE');
    expect(pricing.usageIncluded).toBe(1000);
    expect(pricing.usagePrice).toBe(0.05);
    expect(pricing.usageMetric).toBe('MB');
  });

  // OBJECTIVE — Update existing pricing
  it('should update existing pricing for a skill', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    const { pricing } = await sut.execute({
      skillCode: 'stock.products',
      pricingType: 'FLAT',
      flatPrice: 79.9,
    });

    expect(pricing.flatPrice).toBe(79.9);
    expect(skillPricingRepository.items).toHaveLength(1);
  });

  // OBJECTIVE — Annual discount
  it('should apply annual discount', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    const { pricing } = await sut.execute({
      skillCode: 'stock.products',
      pricingType: 'FLAT',
      flatPrice: 49.9,
      annualDiscount: 20,
    });

    expect(pricing.annualDiscount).toBe(20);
  });

  // VALIDATIONS — skill not found
  it('should throw ResourceNotFoundError when skill does not exist', async () => {
    await expect(
      sut.execute({
        skillCode: 'nonexistent.skill',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  // VALIDATIONS — invalid pricing type
  it('should throw BadRequestError for invalid pricing type', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        skillCode: 'stock.products',
        pricingType: 'INVALID',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // VALIDATIONS — FLAT without flatPrice
  it('should throw BadRequestError when FLAT pricing has no flatPrice', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // VALIDATIONS — PER_UNIT without unitPrice
  it('should throw BadRequestError when PER_UNIT pricing has no unitPrice', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        skillCode: 'stock.products',
        pricingType: 'PER_UNIT',
        unitMetric: 'warehouse',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // VALIDATIONS — PER_UNIT without unitMetric
  it('should throw BadRequestError when PER_UNIT pricing has no unitMetric', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        skillCode: 'stock.products',
        pricingType: 'PER_UNIT',
        unitPrice: 9.9,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  // VALIDATIONS — USAGE without required fields
  it('should throw BadRequestError when USAGE pricing has no usageIncluded', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'storage.files',
        name: 'File Storage',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        skillCode: 'storage.files',
        pricingType: 'USAGE',
        usagePrice: 0.05,
        usageMetric: 'MB',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when USAGE pricing has no usagePrice', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'storage.files',
        name: 'File Storage',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        skillCode: 'storage.files',
        pricingType: 'USAGE',
        usageIncluded: 1000,
        usageMetric: 'MB',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when USAGE pricing has no usageMetric', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'storage.files',
        name: 'File Storage',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        skillCode: 'storage.files',
        pricingType: 'USAGE',
        usageIncluded: 1000,
        usagePrice: 0.05,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
