import { InMemoryCommissionsRepository } from '@/repositories/sales/in-memory/in-memory-commissions-repository';
import type { CommissionRecord } from '@/repositories/sales/commissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCommissionsUseCase } from './list-commissions';

let commissionsRepository: InMemoryCommissionsRepository;
let sut: ListCommissionsUseCase;

function makeCommissionRecord(
  overrides: Partial<CommissionRecord> = {},
): CommissionRecord {
  return {
    id: crypto.randomUUID(),
    tenantId: 'tenant-1',
    orderId: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    baseValue: 1000,
    commissionType: 'PERCENTAGE',
    commissionRate: 10,
    commissionValue: 100,
    status: 'PENDING',
    paidAt: null,
    financeEntryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('List Commissions Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    commissionsRepository = new InMemoryCommissionsRepository();
    sut = new ListCommissionsUseCase(commissionsRepository);
  });

  it('should list commissions with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      commissionsRepository.items.push(
        makeCommissionRecord({ tenantId: TENANT_ID }),
      );
    }

    const { commissions } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(commissions.data).toHaveLength(10);
    expect(commissions.total).toBe(25);
    expect(commissions.totalPages).toBe(3);
    expect(commissions.page).toBe(1);
  });

  it('should filter commissions by status', async () => {
    commissionsRepository.items.push(
      makeCommissionRecord({ tenantId: TENANT_ID, status: 'PENDING' }),
      makeCommissionRecord({ tenantId: TENANT_ID, status: 'PAID' }),
      makeCommissionRecord({ tenantId: TENANT_ID, status: 'PENDING' }),
    );

    const { commissions } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      status: 'PENDING',
    });

    expect(commissions.data).toHaveLength(2);
    expect(commissions.data.every((c) => c.status === 'PENDING')).toBe(true);
  });

  it('should filter commissions by userId', async () => {
    const targetUserId = 'user-target';
    commissionsRepository.items.push(
      makeCommissionRecord({ tenantId: TENANT_ID, userId: targetUserId }),
      makeCommissionRecord({ tenantId: TENANT_ID, userId: 'user-other' }),
      makeCommissionRecord({ tenantId: TENANT_ID, userId: targetUserId }),
    );

    const { commissions } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      userId: targetUserId,
    });

    expect(commissions.data).toHaveLength(2);
    expect(commissions.data.every((c) => c.userId === targetUserId)).toBe(true);
  });

  it('should only return commissions for the given tenant', async () => {
    commissionsRepository.items.push(
      makeCommissionRecord({ tenantId: TENANT_ID }),
      makeCommissionRecord({ tenantId: 'other-tenant' }),
    );

    const { commissions } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(commissions.data).toHaveLength(1);
    expect(commissions.total).toBe(1);
  });

  it('should return empty result when no commissions exist', async () => {
    const { commissions } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(commissions.data).toHaveLength(0);
    expect(commissions.total).toBe(0);
    expect(commissions.totalPages).toBe(0);
  });
});
