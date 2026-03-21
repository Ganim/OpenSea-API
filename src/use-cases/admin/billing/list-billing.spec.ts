import { InMemoryTenantBillingsRepository } from '@/repositories/core/in-memory/in-memory-tenant-billings-repository';
import { TenantBilling } from '@/entities/core/tenant-billing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBillingUseCase } from './list-billing';

let tenantBillingsRepository: InMemoryTenantBillingsRepository;
let sut: ListBillingUseCase;

function makeBilling(
  overrides: Partial<{ tenantId: string; period: string; status: string }> = {},
) {
  return TenantBilling.create({
    tenantId: overrides.tenantId ?? 'tenant-1',
    period: overrides.period ?? '2026-03',
    subscriptionTotal: 100,
    consumptionTotal: 50,
    totalAmount: 150,
    dueDate: new Date('2026-04-10'),
    status: overrides.status ?? 'PENDING',
  });
}

describe('ListBillingUseCase', () => {
  beforeEach(() => {
    tenantBillingsRepository = new InMemoryTenantBillingsRepository();
    sut = new ListBillingUseCase(tenantBillingsRepository);
  });

  it('should list all billing records', async () => {
    await tenantBillingsRepository.create(makeBilling());
    await tenantBillingsRepository.create(
      makeBilling({ status: 'PAID', period: '2026-02' }),
    );

    const { billings } = await sut.execute({});

    expect(billings).toHaveLength(2);
  });

  it('should filter by status', async () => {
    await tenantBillingsRepository.create(makeBilling({ status: 'PENDING' }));
    await tenantBillingsRepository.create(
      makeBilling({ status: 'PAID', period: '2026-02' }),
    );

    const { billings } = await sut.execute({ status: 'PENDING' });

    expect(billings).toHaveLength(1);
    expect(billings[0].status).toBe('PENDING');
  });
});
