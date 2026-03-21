import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TenantBilling } from '@/entities/core/tenant-billing';
import { InMemoryTenantBillingsRepository } from '@/repositories/core/in-memory/in-memory-tenant-billings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkBillingPaidUseCase } from './mark-billing-paid';

let tenantBillingsRepository: InMemoryTenantBillingsRepository;
let sut: MarkBillingPaidUseCase;

describe('MarkBillingPaidUseCase', () => {
  beforeEach(() => {
    tenantBillingsRepository = new InMemoryTenantBillingsRepository();
    sut = new MarkBillingPaidUseCase(tenantBillingsRepository);
  });

  it('should mark a pending billing as paid', async () => {
    const billingEntity = TenantBilling.create({
      tenantId: 'tenant-1',
      period: '2026-03',
      subscriptionTotal: 100,
      consumptionTotal: 50,
      totalAmount: 150,
      dueDate: new Date('2026-04-10'),
      status: 'PENDING',
    });

    await tenantBillingsRepository.create(billingEntity);

    const { billing } = await sut.execute({
      billingId: billingEntity.tenantBillingId.toString(),
      paymentMethod: 'PIX',
    });

    expect(billing.status).toBe('PAID');
    expect(billing.paidAt).toBeTruthy();
    expect(billing.paymentMethod).toBe('PIX');
  });

  it('should throw ResourceNotFoundError when billing does not exist', async () => {
    await expect(
      sut.execute({ billingId: 'nonexistent', paymentMethod: 'PIX' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
