import { InMemorySystemSkillDefinitionsRepository } from '@/repositories/core/in-memory/in-memory-system-skill-definitions-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SkillDependencyService } from '@/services/core/skill-dependency-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveTenantSubscriptionUseCase } from './remove-tenant-subscription';

let skillDefinitionsRepository: InMemorySystemSkillDefinitionsRepository;
let tenantSubscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let skillDependencyService: SkillDependencyService;
let sut: RemoveTenantSubscriptionUseCase;

describe('RemoveTenantSubscriptionUseCase', () => {
  beforeEach(() => {
    skillDefinitionsRepository = new InMemorySystemSkillDefinitionsRepository();
    tenantSubscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    skillDependencyService = new SkillDependencyService(
      skillDefinitionsRepository,
      tenantSubscriptionsRepository,
    );
    sut = new RemoveTenantSubscriptionUseCase(
      skillDefinitionsRepository,
      tenantSubscriptionsRepository,
      skillDependencyService,
    );
  });

  it('should remove a subscription for a skill', async () => {
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
      }),
    );

    const { disabledSkills } = await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
    });

    expect(disabledSkills).toContain('stock.products');
    expect(tenantSubscriptionsRepository.items).toHaveLength(0);
  });

  it('should cascade-disable child skills when removing a parent', async () => {
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

    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.warehouses',
        name: 'Warehouses',
        category: 'MODULE',
        parentSkillCode: 'stock',
      }),
    );

    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock',
      }),
    );

    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
      }),
    );

    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.warehouses',
      }),
    );

    const { disabledSkills } = await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock',
    });

    expect(disabledSkills).toContain('stock');
    expect(disabledSkills).toContain('stock.products');
    expect(disabledSkills).toContain('stock.warehouses');
    expect(tenantSubscriptionsRepository.items).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when skill does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        skillCode: 'nonexistent.skill',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when subscription does not exist', async () => {
    await skillDefinitionsRepository.create(
      SystemSkillDefinition.create({
        code: 'stock.products',
        name: 'Products',
        category: 'MODULE',
      }),
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
