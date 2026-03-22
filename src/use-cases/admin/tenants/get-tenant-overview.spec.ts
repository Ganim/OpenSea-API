import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { InMemorySkillPricingRepository } from '@/repositories/core/in-memory/in-memory-skill-pricing-repository';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { InMemoryTenantIntegrationStatusRepository } from '@/repositories/core/in-memory/in-memory-tenant-integration-status-repository';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { SkillPricing } from '@/entities/core/skill-pricing';
import { TenantIntegrationStatus } from '@/entities/core/tenant-integration-status';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantOverviewUseCase } from './get-tenant-overview';

let tenantsRepository: InMemoryTenantsRepository;
let tenantSubscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let skillPricingRepository: InMemorySkillPricingRepository;
let tenantUsersRepository: InMemoryTenantUsersRepository;
let tenantIntegrationStatusRepository: InMemoryTenantIntegrationStatusRepository;
let sut: GetTenantOverviewUseCase;

describe('GetTenantOverviewUseCase', () => {
  let tenantId: string;

  beforeEach(async () => {
    tenantsRepository = new InMemoryTenantsRepository();
    tenantSubscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    skillPricingRepository = new InMemorySkillPricingRepository();
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    tenantIntegrationStatusRepository =
      new InMemoryTenantIntegrationStatusRepository();

    sut = new GetTenantOverviewUseCase(
      tenantsRepository,
      tenantSubscriptionsRepository,
      skillPricingRepository,
      tenantUsersRepository,
      tenantIntegrationStatusRepository,
    );

    const tenant = await tenantsRepository.create({
      name: 'Acme Corp',
      slug: 'acme-corp',
    });

    tenantId = tenant.id.toString();
  });

  it('should return a complete tenant overview', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId,
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    await tenantUsersRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      userId: new UniqueEntityID(),
    });

    await tenantIntegrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId,
        integrationType: 'SMTP',
        status: 'CONNECTED',
      }),
    );

    const overview = await sut.execute({ tenantId });

    expect(overview.tenantName).toBe('Acme Corp');
    expect(overview.tenantStatus).toBe('ACTIVE');
    expect(overview.subscriptionCount).toBe(1);
    expect(overview.totalMRR).toBe(49.9);
    expect(overview.activeUsers).toBe(1);
    expect(overview.integrations).toHaveLength(1);
  });

  it('should return zero MRR when no subscriptions exist', async () => {
    const overview = await sut.execute({ tenantId });

    expect(overview.subscriptionCount).toBe(0);
    expect(overview.totalMRR).toBe(0);
  });

  it('should use custom price when set on subscription', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId,
        skillCode: 'stock.products',
        status: 'ACTIVE',
        customPrice: 25,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    const overview = await sut.execute({ tenantId });

    expect(overview.totalMRR).toBe(25);
  });

  it('should throw ResourceNotFoundError when tenant does not exist', async () => {
    await expect(
      sut.execute({ tenantId: 'nonexistent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
