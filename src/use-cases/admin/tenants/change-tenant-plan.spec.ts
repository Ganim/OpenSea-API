import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { InMemoryTenantPlansRepository } from '@/repositories/core/in-memory/in-memory-tenant-plans-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ChangeTenantPlanUseCase } from './change-tenant-plan';

let tenantsRepository: InMemoryTenantsRepository;
let plansRepository: InMemoryPlansRepository;
let tenantPlansRepository: InMemoryTenantPlansRepository;
let sut: ChangeTenantPlanUseCase;

describe('ChangeTenantPlanUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    plansRepository = new InMemoryPlansRepository();
    tenantPlansRepository = new InMemoryTenantPlansRepository();
    sut = new ChangeTenantPlanUseCase(
      tenantsRepository,
      plansRepository,
      tenantPlansRepository,
    );
  });

  it('should change a tenant plan', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test Tenant',
      slug: 'test-tenant',
    });
    const freePlan = await plansRepository.create({ name: 'Free' });
    const proPlan = await plansRepository.create({
      name: 'Professional',
      tier: 'PROFESSIONAL',
      price: 299.9,
    });
    await tenantPlansRepository.create({
      tenantId: tenant.tenantId,
      planId: freePlan.planId,
    });

    const { tenantPlan } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      planId: proPlan.planId.toString(),
    });

    expect(tenantPlan).toBeDefined();
    expect(tenantPlan.planId).toBe(proPlan.planId.toString());
  });

  it('should throw ResourceNotFoundError for non-existent tenant', async () => {
    const plan = await plansRepository.create({ name: 'Free' });
    await expect(() =>
      sut.execute({
        tenantId: 'non-existent-id',
        planId: plan.planId.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError for non-existent plan', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    await expect(() =>
      sut.execute({
        tenantId: tenant.tenantId.toString(),
        planId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should assign a plan when tenant has no plan yet', async () => {
    const tenant = await tenantsRepository.create({
      name: 'Test',
      slug: 'test',
    });
    const plan = await plansRepository.create({ name: 'Free' });

    const { tenantPlan } = await sut.execute({
      tenantId: tenant.tenantId.toString(),
      planId: plan.planId.toString(),
    });

    expect(tenantPlan).toBeDefined();
    expect(tenantPlan.tenantId).toBe(tenant.tenantId.toString());
    expect(tenantPlan.planId).toBe(plan.planId.toString());
  });
});
