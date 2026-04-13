import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReconcilePendingChargesUseCase } from './reconcile-pending-charges.use-case';
import type { ReconciliationResult } from '@/services/payment/charge-reconciliation.service';

let reconciliationService: {
  withTenant: ReturnType<typeof vi.fn>;
  reconcileOverdueCharges: ReturnType<typeof vi.fn>;
};
let sut: ReconcilePendingChargesUseCase;

const tenantId = 'tenant-1';

describe('ReconcilePendingChargesUseCase', () => {
  beforeEach(() => {
    const mockResult: ReconciliationResult = {
      processed: 5,
      confirmed: 2,
      failed: 1,
      expired: 1,
      notFound: 1,
      errors: [],
    };

    reconciliationService = {
      withTenant: vi.fn().mockReturnThis(),
      reconcileOverdueCharges: vi.fn().mockResolvedValue(mockResult),
    };

    sut = new ReconcilePendingChargesUseCase(reconciliationService as any);
  });

  it('should delegate to reconciliation service with correct tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(reconciliationService.withTenant).toHaveBeenCalledWith(tenantId);
    expect(result.processed).toBe(5);
    expect(result.confirmed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.expired).toBe(1);
    expect(result.notFound).toBe(1);
  });

  it('should propagate errors from reconciliation service', async () => {
    reconciliationService.reconcileOverdueCharges.mockRejectedValueOnce(
      new Error('ChargeReconciliationService requires tenant context.'),
    );

    await expect(sut.execute({ tenantId })).rejects.toThrow(
      'ChargeReconciliationService requires tenant context.',
    );
  });
});
