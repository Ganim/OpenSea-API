import { InMemoryTenantBillingsRepository } from '@/repositories/core/in-memory/in-memory-tenant-billings-repository';
import { TenantBilling } from '@/entities/core/tenant-billing';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantBillingUseCase } from './get-tenant-billing';

let tenantBillingsRepository: InMemoryTenantBillingsRepository;
let sut: GetTenantBillingUseCase;

describe('GetTenantBillingUseCase', () => {
  beforeEach(() => {
    tenantBillingsRepository = new InMemoryTenantBillingsRepository();
    sut = new GetTenantBillingUseCase(tenantBillingsRepository);
  });

  it('should return billing history for a tenant', async () => {
    await tenantBillingsRepository.create(
      TenantBilling.create({
        tenantId: 'tenant-1',
        period: '2026-01',
        subscriptionTotal: 100,
        consumptionTotal: 50,
        totalAmount: 150,
        dueDate: new Date('2026-02-10'),
      }),
    );
    await tenantBillingsRepository.create(
      TenantBilling.create({
        tenantId: 'tenant-1',
        period: '2026-02',
        subscriptionTotal: 100,
        consumptionTotal: 60,
        totalAmount: 160,
        dueDate: new Date('2026-03-10'),
      }),
    );

    const { billings } = await sut.execute({ tenantId: 'tenant-1' });

    expect(billings).toHaveLength(2);
  });

  it('should return empty array when tenant has no billing history', async () => {
    const { billings } = await sut.execute({ tenantId: 'tenant-1' });
    expect(billings).toHaveLength(0);
  });
});
