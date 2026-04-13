import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplyTenantDiscountUseCase } from './apply-tenant-discount';

let subscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let sut: ApplyTenantDiscountUseCase;

const TENANT_ID = 'tenant-1';
const SKILL_CODE = 'stock.products';

function createSubscription(
  tenantId: string = TENANT_ID,
  skillCode: string = SKILL_CODE,
) {
  const subscription = TenantSubscription.create({
    tenantId,
    skillCode,
  });
  subscriptionsRepository.items.push(subscription);
  return subscription;
}

describe('ApplyTenantDiscountUseCase', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    sut = new ApplyTenantDiscountUseCase(subscriptionsRepository);
  });

  it('should apply a discount to an existing subscription', async () => {
    createSubscription();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      skillCode: SKILL_CODE,
      discountPercent: 20,
    });

    expect(result.subscription.discountPercent).toBe(20);
  });

  it('should update notes when provided', async () => {
    createSubscription();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      skillCode: SKILL_CODE,
      discountPercent: 10,
      notes: 'Early bird discount',
    });

    expect(result.subscription.discountPercent).toBe(10);
    expect(result.subscription.notes).toBe('Early bird discount');
  });

  it('should allow setting discount to zero', async () => {
    const subscription = createSubscription();
    subscription.discountPercent = 25;

    const result = await sut.execute({
      tenantId: TENANT_ID,
      skillCode: SKILL_CODE,
      discountPercent: 0,
    });

    expect(result.subscription.discountPercent).toBe(0);
  });

  it('should throw ResourceNotFoundError if subscription not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        skillCode: 'non-existent-skill',
        discountPercent: 10,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError if discount is negative', async () => {
    createSubscription();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        skillCode: SKILL_CODE,
        discountPercent: -5,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError if discount exceeds 100', async () => {
    createSubscription();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        skillCode: SKILL_CODE,
        discountPercent: 101,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
