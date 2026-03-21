import { InMemorySkillPricingRepository } from '@/repositories/core/in-memory/in-memory-skill-pricing-repository';
import { InMemorySystemSkillDefinitionsRepository } from '@/repositories/core/in-memory/in-memory-system-skill-definitions-repository';
import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { SkillPricing } from '@/entities/core/skill-pricing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSkillTreeUseCase } from './get-skill-tree';

let skillDefinitionsRepository: InMemorySystemSkillDefinitionsRepository;
let skillPricingRepository: InMemorySkillPricingRepository;
let sut: GetSkillTreeUseCase;

describe('GetSkillTreeUseCase', () => {
  beforeEach(() => {
    skillDefinitionsRepository = new InMemorySystemSkillDefinitionsRepository();
    skillPricingRepository = new InMemorySkillPricingRepository();
    sut = new GetSkillTreeUseCase(
      skillDefinitionsRepository,
      skillPricingRepository,
    );
  });

  it('should build a tree with root nodes and children', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock',
        name: 'Stock Module',
        category: 'MODULE',
        parentSkillCode: null,
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'FEATURE',
        parentSkillCode: 'stock',
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.warehouses',
        name: 'Warehouses',
        category: 'FEATURE',
        parentSkillCode: 'stock',
        sortOrder: 2,
      }),
    );

    const { tree } = await sut.execute({});

    expect(tree).toHaveLength(1);
    expect(tree[0].skill.code).toBe('stock');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].skill.code).toBe('stock.products');
    expect(tree[0].children[1].skill.code).toBe('stock.warehouses');
  });

  it('should build nested tree with multiple levels', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock',
        name: 'Stock Module',
        category: 'MODULE',
        parentSkillCode: null,
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'FEATURE',
        parentSkillCode: 'stock',
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products.variants',
        name: 'Product Variants',
        category: 'SUB_FEATURE',
        parentSkillCode: 'stock.products',
        sortOrder: 1,
      }),
    );

    const { tree } = await sut.execute({});

    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].skill.code).toBe(
      'stock.products.variants',
    );
  });

  it('should include pricing data in tree nodes', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock',
        name: 'Stock Module',
        category: 'MODULE',
        parentSkillCode: null,
        sortOrder: 1,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock',
        pricingType: 'FLAT',
        flatPrice: 99.9,
      }),
    );

    const { tree } = await sut.execute({});

    expect(tree).toHaveLength(1);
    expect(tree[0].pricing).not.toBeNull();
    expect(tree[0].pricing!.flatPrice).toBe(99.9);
  });

  it('should return null pricing for nodes without pricing', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock',
        name: 'Stock Module',
        category: 'MODULE',
        parentSkillCode: null,
        sortOrder: 1,
      }),
    );

    const { tree } = await sut.execute({});

    expect(tree).toHaveLength(1);
    expect(tree[0].pricing).toBeNull();
  });

  it('should filter tree by module', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock',
        name: 'Stock Module',
        category: 'MODULE',
        module: 'stock',
        parentSkillCode: null,
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'hr',
        name: 'HR Module',
        category: 'MODULE',
        module: 'hr',
        parentSkillCode: null,
        sortOrder: 2,
      }),
    );

    const { tree } = await sut.execute({ module: 'stock' });

    expect(tree).toHaveLength(1);
    expect(tree[0].skill.code).toBe('stock');
  });

  it('should return an empty tree when no skills exist', async () => {
    const { tree } = await sut.execute({});

    expect(tree).toHaveLength(0);
    expect(tree).toEqual([]);
  });

  it('should handle multiple root nodes', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock',
        name: 'Stock Module',
        category: 'MODULE',
        parentSkillCode: null,
        sortOrder: 1,
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'hr',
        name: 'HR Module',
        category: 'MODULE',
        parentSkillCode: null,
        sortOrder: 2,
      }),
    );

    const { tree } = await sut.execute({});

    expect(tree).toHaveLength(2);
    expect(tree[0].skill.code).toBe('stock');
    expect(tree[1].skill.code).toBe('hr');
  });
});
