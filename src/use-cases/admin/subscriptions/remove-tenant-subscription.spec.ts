import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveTenantSubscriptionUseCase } from './remove-tenant-subscription';

let subscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let sut: RemoveTenantSubscriptionUseCase;

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

describe('RemoveTenantSubscriptionUseCase', () => {
  beforeEach(() => {
    subscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    sut = new RemoveTenantSubscriptionUseCase(subscriptionsRepository);
  });

  it('should cancel an existing subscription', async () => {
    createSubscription();

    const result = await sut.execute({
      tenantId: TENANT_ID,
      skillCode: SKILL_CODE,
    });

    expect(result.success).toBe(true);

    const updated = subscriptionsRepository.items[0];
    expect(updated.status).toBe('CANCELLED');
    expect(updated.cancelledAt).toBeDefined();
    expect(updated.cancelledAt).toBeInstanceOf(Date);
  });

  it('should throw ResourceNotFoundError if subscription does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        skillCode: 'non-existent-skill',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError for a different tenant', async () => {
    createSubscription('other-tenant', SKILL_CODE);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        skillCode: SKILL_CODE,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
