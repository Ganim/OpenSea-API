import type { PosFiscalConfig } from '@/entities/sales/pos-fiscal-config';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface PosFiscalConfigsRepository {
  findByTenantId(tenantId: string): Promise<PosFiscalConfig | null>;
  upsert(config: PosFiscalConfig, tx?: TransactionClient): Promise<void>;
  /**
   * Atomically increments the NF-C-e next number for the tenant and returns
   * the value BEFORE the increment (i.e. the number that should be used for
   * the document being emitted now).
   *
   * Race-condition note: implementation MUST run inside a transaction
   * (either the provided `tx` or one started internally) so the read+update
   * pair is atomic. The current Prisma implementation uses a transactional
   * select-then-update pattern for simplicity. Higher-throughput needs may
   * later switch to a raw `UPDATE ... RETURNING` SQL statement.
   */
  incrementNfceNumber(
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<number>;
}
