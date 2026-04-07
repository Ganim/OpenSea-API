import type {
  ChargeReconciliationService,
  ReconciliationResult,
} from '@/services/payment/charge-reconciliation.service';

interface ReconcilePendingChargesUseCaseInput {
  tenantId: string;
}

export class ReconcilePendingChargesUseCase {
  constructor(private reconciliationService: ChargeReconciliationService) {}

  async execute(
    input: ReconcilePendingChargesUseCaseInput,
  ): Promise<ReconciliationResult> {
    return this.reconciliationService
      .withTenant(input.tenantId)
      .reconcileOverdueCharges();
  }
}
