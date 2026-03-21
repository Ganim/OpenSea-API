import { InMemorySkillPricingRepository } from '@/repositories/core/in-memory/in-memory-skill-pricing-repository';
import { SkillPricing } from '@/entities/core/skill-pricing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSkillPricingUseCase } from './list-skill-pricing';

let skillPricingRepository: InMemorySkillPricingRepository;
let sut: ListSkillPricingUseCase;

describe('ListSkillPricingUseCase', () => {
  beforeEach(() => {
    skillPricingRepository = new InMemorySkillPricingRepository();
    sut = new ListSkillPricingUseCase(skillPricingRepository);
  });

  it('should list all skill pricing entries', async () => {
    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'hr.employees',
        pricingType: 'PER_UNIT',
        unitPrice: 9.9,
        unitMetric: 'employee',
      }),
    );

    const { pricing } = await sut.execute({});

    expect(pricing).toHaveLength(2);
  });

  it('should filter pricing entries by type', async () => {
    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'hr.employees',
        pricingType: 'PER_UNIT',
        unitPrice: 9.9,
        unitMetric: 'employee',
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.warehouses',
        pricingType: 'FLAT',
        flatPrice: 29.9,
      }),
    );

    const { pricing } = await sut.execute({ pricingType: 'FLAT' });

    expect(pricing).toHaveLength(2);
    expect(pricing.every((p) => p.pricingType === 'FLAT')).toBe(true);
  });

  it('should return an empty array when no pricing exists', async () => {
    const { pricing } = await sut.execute({});

    expect(pricing).toHaveLength(0);
    expect(pricing).toEqual([]);
  });

  it('should return an empty array when no pricing matches the filter', async () => {
    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    const { pricing } = await sut.execute({ pricingType: 'USAGE' });

    expect(pricing).toHaveLength(0);
  });
});
