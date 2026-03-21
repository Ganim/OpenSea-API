import { InMemoryTenantSubscriptionsRepository } from '@/repositories/core/in-memory/in-memory-tenant-subscriptions-repository';
import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplyTenantDiscountUseCase } from './apply-tenant-discount';

let tenantSubscriptionsRepository: InMemoryTenantSubscriptionsRepository;
let sut: ApplyTenantDiscountUseCase;

describe('ApplyTenantDiscountUseCase', () => {
  beforeEach(() => {
    tenantSubscriptionsRepository = new InMemoryTenantSubscriptionsRepository();
    sut = new ApplyTenantDiscountUseCase(tenantSubscriptionsRepository);
  });

  it('should apply discount to a single subscription', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    const { updated } = await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
      discountPercent: 25,
    });

    expect(updated).toBe(1);

    const subscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.products',
      );

    expect(subscription!.discountPercent).toBe(25);
  });

  it('should apply custom price to a single subscription', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    const { updated } = await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
      customPrice: 19.9,
    });

    expect(updated).toBe(1);

    const subscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.products',
      );

    expect(subscription!.customPrice).toBe(19.9);
  });

  it('should apply discount to all active subscriptions when no skillCode', async () => {
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

    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'finance.entries',
        status: 'CANCELLED',
      }),
    );

    const { updated } = await sut.execute({
      tenantId: 'tenant-1',
      discountPercent: 15,
    });

    expect(updated).toBe(2);

    const stockSubscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.products',
      );
    const hrSubscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'hr.employees',
      );

    expect(stockSubscription!.discountPercent).toBe(15);
    expect(hrSubscription!.discountPercent).toBe(15);
  });

  it('should store grantedBy in metadata', async () => {
    await tenantSubscriptionsRepository.create(
      TenantSubscription.create({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
        status: 'ACTIVE',
      }),
    );

    await sut.execute({
      tenantId: 'tenant-1',
      skillCode: 'stock.products',
      discountPercent: 10,
      grantedBy: 'admin-user-id',
      notes: 'Loyalty discount',
    });

    const subscription =
      await tenantSubscriptionsRepository.findByTenantAndSkill(
        'tenant-1',
        'stock.products',
      );

    expect(subscription!.metadata).toEqual(
      expect.objectContaining({ discountGrantedBy: 'admin-user-id' }),
    );
    expect(subscription!.notes).toBe('Loyalty discount');
  });

  it('should return zero updated when tenant has no active subscriptions', async () => {
    const { updated } = await sut.execute({
      tenantId: 'tenant-1',
      discountPercent: 10,
    });

    expect(updated).toBe(0);
  });

  it('should throw BadRequestError when neither discountPercent nor customPrice provided', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        skillCode: 'stock.products',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when discountPercent is out of range', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        discountPercent: 150,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError when specific subscription not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        skillCode: 'nonexistent.skill',
        discountPercent: 10,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
