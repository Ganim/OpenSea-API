import { InMemorySkillPricingRepository } from '@/repositories/core/in-memory/in-memory-skill-pricing-repository';
import { InMemorySystemSkillDefinitionsRepository } from '@/repositories/core/in-memory/in-memory-system-skill-definitions-repository';
import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { SkillPricing } from '@/entities/core/skill-pricing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSkillDefinitionsUseCase } from './list-skill-definitions';

let skillDefinitionsRepository: InMemorySystemSkillDefinitionsRepository;
let skillPricingRepository: InMemorySkillPricingRepository;
let sut: ListSkillDefinitionsUseCase;

describe('ListSkillDefinitionsUseCase', () => {
  beforeEach(() => {
    skillDefinitionsRepository = new InMemorySystemSkillDefinitionsRepository();
    skillPricingRepository = new InMemorySkillPricingRepository();
    sut = new ListSkillDefinitionsUseCase(
      skillDefinitionsRepository,
      skillPricingRepository,
    );
  });

  it('should list all skill definitions', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'hr.employees',
        name: 'Employees',
        category: 'MODULE',
        sortOrder: 2,
      }),
    );

    const { skills } = await sut.execute({});

    expect(skills).toHaveLength(2);
    expect(skills[0].skill.code).toBe('stock.products');
    expect(skills[1].skill.code).toBe('hr.employees');
  });

  it('should filter skill definitions by module', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
        module: 'stock',
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'hr.employees',
        name: 'Employees',
        category: 'MODULE',
        module: 'hr',
        sortOrder: 2,
      }),
    );

    const { skills } = await sut.execute({ module: 'stock' });

    expect(skills).toHaveLength(1);
    expect(skills[0].skill.code).toBe('stock.products');
  });

  it('should include pricing data when available', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
        sortOrder: 1,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    const { skills } = await sut.execute({});

    expect(skills).toHaveLength(1);
    expect(skills[0].pricing).not.toBeNull();
    expect(skills[0].pricing!.flatPrice).toBe(49.9);
  });

  it('should return null pricing when no pricing is set', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
        sortOrder: 1,
      }),
    );

    const { skills } = await sut.execute({});

    expect(skills).toHaveLength(1);
    expect(skills[0].pricing).toBeNull();
  });

  it('should return an empty array when no skills exist', async () => {
    const { skills } = await sut.execute({});

    expect(skills).toHaveLength(0);
    expect(skills).toEqual([]);
  });
});
