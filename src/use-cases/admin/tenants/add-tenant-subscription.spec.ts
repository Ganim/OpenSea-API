import { InMemorySkillPricingRepository } from '@/repositories/core/in-memory/in-memory-skill-pricing-repository';
import { InMemorySystemSkillDefinitionsRepository } from '@/repositories/core/in-memory/in-memory-system-skill-definitions-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { SkillDependencyService } from '@/services/core/skill-dependency-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddTenantSubscriptionUseCase } from './add-tenant-subscription';

let skillDefinitionsRepository: InMemorySystemSkillDefinitionsRepository;
let tenantSubscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let skillPricingRepository: InMemorySkillPricingRepository;
let skillDependencyService: SkillDependencyService;
let sut: AddTenantSubscriptionUseCase;

describe('AddTenantSubscriptionUseCase', () => {
  beforeEach(() => {
    skillDefinitionsRepository = new InMemorySystemSkillDefinitionsRepository();
    tenantSubscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    skillPricingRepository = new InMemorySkillPricingRepository();
    skillDependencyService = new SkillDependencyService(
      skillDefinitionsRepository,
      tenantSubscriptionsRepository,
    );
    sut = new AddTenantSubscriptionUseCase(
      skillDefinitionsRepository,
      tenantSubscriptionsRepository,
      skillPricingRepository,
      skillDependencyService,
    );
  });

  it('should add a subscription for a valid skill', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    const { enabledSkills } = await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
    });

    expect(enabledSkills).toContain('stock.products');
    expect(tenantSubscriptionsRepository.items).toHaveLength(1);
  });

  it('should auto-enable parent skills when adding a child skill', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock',
        name: 'Stock Module',
        category: 'MODULE',
      }),
    );

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
        parentSkillCode: 'stock',
      }),
    );

    const { enabledSkills } = await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
    });

    expect(enabledSkills).toContain('stock.products');
    expect(enabledSkills).toContain('stock');
    expect(tenantSubscriptionsRepository.items).toHaveLength(2);
  });

  it('should apply custom price to the primary subscription', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
      customPrice: 29.9,
    });

    const subscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.products',
      );

    expect(subscription!.customPrice).toBe(29.9);
  });

  it('should apply discount percent to the primary subscription', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
      discountPercent: 20,
    });

    const subscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.products',
      );

    expect(subscription!.discountPercent).toBe(20);
  });

  it('should apply quantity to the primary subscription', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.warehouses',
        name: 'Warehouses',
        category: 'MODULE',
      }),
    );

    await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.warehouses',
      quantity: 5,
    });

    const subscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.warehouses',
      );

    expect(subscription!.quantity).toBe(5);
  });

  it('should throw ResourceNotFoundError when skill does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        skillCode: 'nonexistent.skill',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ConflictError when tenant already has an active subscription', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should store grantedBy in metadata', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
      grantedBy: 'admin-user-id',
      notes: 'Free trial for 30 days',
    });

    const subscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.products',
      );

    expect(subscription!.metadata).toEqual(
      expect.objectContaining({ grantedBy: 'admin-user-id' }),
    );
    expect(subscription!.notes).toBe('Free trial for 30 days');
  });
});
