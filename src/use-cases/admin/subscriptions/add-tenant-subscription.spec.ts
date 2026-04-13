import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SystemSkillDefinition } from '@/entities/core/system-skill-definition';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { InMemorySystemSkillDefinitionsRepository } from '@/repositories/core/in-memory/in-memory-system-skill-definitions-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddTenantSubscriptionUseCase } from './add-tenant-subscription';

let subscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let tenantsRepository: InMemoryTenantsRepository;
let skillDefinitionsRepository: InMemorySystemSkillDefinitionsRepository;
let sut: AddTenantSubscriptionUseCase;

const SKILL_CODE = 'stock.products';

async function createTenant() {
  const tenant = await tenantsRepository.create({
    name: 'Test Tenant',
    slug: 'test-tenant',
  });
  return tenant;
}

function createSkillDefinition(code: string = SKILL_CODE) {
  const skill = SystemSkillDefinition.create({
    code,
    name: 'Products',
    category: 'stock',
  });
  skillDefinitionsRepository.items.push(skill);
  return skill;
}

describe('AddTenantSubscriptionUseCase', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    tenantsRepository = new InMemoryTenantsRepository();
    skillDefinitionsRepository =
      new InMemorySystemSkillDefinitionsRepository();

    sut = new AddTenantSubscriptionUseCase(
      subscriptionsRepository,
      tenantsRepository,
      skillDefinitionsRepository,
    );
  });

  it('should add a subscription to a tenant', async () => {
    const tenant = await createTenant();
    createSkillDefinition();

    const result = await sut.execute({
      tenantId: tenant.id.toString(),
      skillCode: SKILL_CODE,
    });

    expect(result.subscription).toBeDefined();
    expect(result.subscription.tenantId).toBe(tenant.id.toString());
    expect(result.subscription.skillCode).toBe(SKILL_CODE);
    expect(result.subscription.status).toBe('ACTIVE');
    expect(result.subscription.quantity).toBe(1);
    expect(subscriptionsRepository.items).toHaveLength(1);
  });

  it('should add a subscription with custom price and discount', async () => {
    const tenant = await createTenant();
    createSkillDefinition();

    const result = await sut.execute({
      tenantId: tenant.id.toString(),
      skillCode: SKILL_CODE,
      quantity: 5,
      customPrice: 99.99,
      discountPercent: 15,
      notes: 'VIP discount',
      grantedBy: 'admin-user-id',
    });

    expect(result.subscription.quantity).toBe(5);
    expect(result.subscription.customPrice).toBe(99.99);
    expect(result.subscription.discountPercent).toBe(15);
    expect(result.subscription.notes).toBe('VIP discount');
    expect(result.subscription.grantedBy).toBe('admin-user-id');
  });

  it('should throw ResourceNotFoundError if tenant does not exist', async () => {
    createSkillDefinition();

    await expect(
      sut.execute({
        tenantId: 'non-existent-tenant',
        skillCode: SKILL_CODE,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError if skill definition does not exist', async () => {
    const tenant = await createTenant();

    await expect(
      sut.execute({
        tenantId: tenant.id.toString(),
        skillCode: 'non-existent-skill',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ConflictError if tenant already has active subscription for skill', async () => {
    const tenant = await createTenant();
    createSkillDefinition();

    const existing = TenantSubscription.create({
      tenantId: tenant.id.toString(),
      skillCode: SKILL_CODE,
    });
    subscriptionsRepository.items.push(existing);

    await expect(
      sut.execute({
        tenantId: tenant.id.toString(),
        skillCode: SKILL_CODE,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should allow adding subscription if existing one is cancelled', async () => {
    const tenant = await createTenant();
    createSkillDefinition();

    const cancelled = TenantSubscription.create({
      tenantId: tenant.id.toString(),
      skillCode: SKILL_CODE,
    });
    cancelled.status = 'CANCELLED';
    subscriptionsRepository.items.push(cancelled);

    const result = await sut.execute({
      tenantId: tenant.id.toString(),
      skillCode: SKILL_CODE,
    });

    expect(result.subscription.status).toBe('ACTIVE');
  });

  it('should throw BadRequestError if discount percent is negative', async () => {
    const tenant = await createTenant();
    createSkillDefinition();

    await expect(
      sut.execute({
        tenantId: tenant.id.toString(),
        skillCode: SKILL_CODE,
        discountPercent: -10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError if discount percent exceeds 100', async () => {
    const tenant = await createTenant();
    createSkillDefinition();

    await expect(
      sut.execute({
        tenantId: tenant.id.toString(),
        skillCode: SKILL_CODE,
        discountPercent: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
