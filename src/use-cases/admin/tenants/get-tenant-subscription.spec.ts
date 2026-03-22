import { InMemorySkillPricingRepository } from '@/repositories/core/in-memory/in-memory-skill-pricing-repository';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { SkillPricing } from '@/entities/core/skill-pricing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantSubscriptionUseCase } from './get-tenant-subscription';

let tenantSubscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let skillPricingRepository: InMemorySkillPricingRepository;
let sut: GetTenantSubscriptionUseCase;

describe('GetTenantSubscriptionUseCase', () => {
  beforeEach(() => {
    tenantSubscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    skillPricingRepository = new InMemorySkillPricingRepository();
    sut = new GetTenantSubscriptionUseCase(
      tenantSubscriptionsRepository,
      skillPricingRepository,
    );
  });

  it('should return active subscriptions for a tenant', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'hr.employees',
        status: 'ACTIVE',
      }),
    );

    const { subscriptions } = await sut.execute({ tenantId: 'tenant-1' });

    expect(subscriptions).toHaveLength(2);
  });

  it('should not include cancelled subscriptions', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'hr.employees',
        status: 'CANCELLED',
      }),
    );

    const { subscriptions } = await sut.execute({ tenantId: 'tenant-1' });

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].skillCode).toBe('stock.products');
  });

  it('should calculate totalMRR from default pricing', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
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

    const { totalMRR } = await sut.execute({ tenantId: 'tenant-1' });

    expect(totalMRR).toBe(49.9);
  });

  it('should use customPrice over default pricing when set', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
        customPrice: 29.9,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 49.9,
      }),
    );

    const { totalMRR } = await sut.execute({ tenantId: 'tenant-1' });

    expect(totalMRR).toBe(29.9);
  });

  it('should apply discount percent to pricing', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
        discountPercent: 50,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.products',
        pricingType: 'FLAT',
        flatPrice: 100,
      }),
    );

    const { totalMRR } = await sut.execute({ tenantId: 'tenant-1' });

    expect(totalMRR).toBe(50);
  });

  it('should multiply price by quantity', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.warehouses',
        status: 'ACTIVE',
        quantity: 3,
      }),
    );

    await skillPricingRepository.upsert(
      SkillPricing.create({
        skillCode: 'stock.warehouses',
        pricingType: 'FLAT',
        flatPrice: 10,
      }),
    );

    const { totalMRR } = await sut.execute({ tenantId: 'tenant-1' });

    expect(totalMRR).toBe(30);
  });

  it('should return zero MRR when no pricing exists', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    const { totalMRR } = await sut.execute({ tenantId: 'tenant-1' });

    expect(totalMRR).toBe(0);
  });

  it('should return empty array when tenant has no subscriptions', async () => {
    const { subscriptions, totalMRR } = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(subscriptions).toHaveLength(0);
    expect(totalMRR).toBe(0);
  });
});
