import { InMemoryTenantBillingsRepository } from '@/repositories/core/in-memory/in-memory-tenant-billings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateBillingUseCase } from './generate-billing';

let tenantBillingsRepository: InMemoryTenantBillingsRepository;
let sut: GenerateBillingUseCase;

describe('GenerateBillingUseCase', () => {
  beforeEach(() => {
    tenantBillingsRepository = new InMemoryTenantBillingsRepository();
    sut = new GenerateBillingUseCase(tenantBillingsRepository);
  });

  it('should generate a monthly billing', async () => {
    const { billing } = await sut.execute({
      tenantId: 'tenant-1',
      referenceMonth: '2026-03',
      subscriptionTotal: 199.9,
      consumptionTotal: 50.1,
      dueDate: new Date('2026-04-10'),
    });

    expect(billing.tenantId).toBe('tenant-1');
    expect(billing.period).toBe('2026-03');
    expect(billing.totalAmount).toBeCloseTo(250);
    expect(billing.status).toBe('PENDING');
  });

  it('should throw error when billing already exists for the period', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      referenceMonth: '2026-03',
      subscriptionTotal: 100,
      consumptionTotal: 50,
      dueDate: new Date('2026-04-10'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        referenceMonth: '2026-03',
        subscriptionTotal: 100,
        consumptionTotal: 50,
        dueDate: new Date('2026-04-10'),
      }),
    ).rejects.toThrow('already exists');
  });

  it('should apply discounts correctly', async () => {
    const { billing } = await sut.execute({
      tenantId: 'tenant-1',
      referenceMonth: '2026-03',
      subscriptionTotal: 200,
      consumptionTotal: 100,
      discountsTotal: 50,
      dueDate: new Date('2026-04-10'),
    });

    expect(billing.totalAmount).toBe(250);
    expect(billing.discountsTotal).toBe(50);
  });
});
