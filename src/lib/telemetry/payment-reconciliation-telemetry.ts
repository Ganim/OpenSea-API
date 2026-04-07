import {
  paymentReconciliationChargesTotal,
  paymentReconciliationDurationSeconds,
  paymentReconciliationRunsTotal,
} from '@/lib/metrics';

export interface PaymentReconciliationMetrics {
  tenantId: string;
  processed: number;
  confirmed: number;
  failed: number;
  expired: number;
  duration: number;
  success: boolean;
}

function getTenantLabel(tenantId: string): string {
  return tenantId || 'unknown';
}

export function recordPaymentReconciliation(
  metrics: PaymentReconciliationMetrics,
): void {
  const tenant = getTenantLabel(metrics.tenantId);
  const success = metrics.success ? 'true' : 'false';

  paymentReconciliationRunsTotal.inc({ tenant, success });
  paymentReconciliationDurationSeconds.observe(
    { tenant, success },
    metrics.duration / 1000,
  );

  if (metrics.processed > 0) {
    paymentReconciliationChargesTotal.inc(
      { tenant, status: 'processed' },
      metrics.processed,
    );
  }
  if (metrics.confirmed > 0) {
    paymentReconciliationChargesTotal.inc(
      { tenant, status: 'confirmed' },
      metrics.confirmed,
    );
  }
  if (metrics.failed > 0) {
    paymentReconciliationChargesTotal.inc(
      { tenant, status: 'failed' },
      metrics.failed,
    );
  }
  if (metrics.expired > 0) {
    paymentReconciliationChargesTotal.inc(
      { tenant, status: 'expired' },
      metrics.expired,
    );
  }
}
