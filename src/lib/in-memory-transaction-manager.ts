import type { TransactionClient, TransactionManager } from './transaction-manager';

/**
 * Test-only TransactionManager that serializes concurrent transactions
 * via an internal promise queue. It does not provide real ACID guarantees
 * (the in-memory repositories don't either), but it accurately reproduces
 * the sequencing that PostgreSQL row-level locks impose on concurrent
 * payment flows. This lets concurrency specs assert that two parallel
 * registerPayment calls produce one success + one rejection — the same
 * outcome the production database delivers via SELECT FOR UPDATE.
 *
 * Use only in unit tests. Production code uses PrismaTransactionManager.
 */
export class InMemoryTransactionManager implements TransactionManager {
  private currentChain: Promise<unknown> = Promise.resolve();

  async run<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
    const next = this.currentChain.then(() => fn({} as TransactionClient));
    // Swallow rejections in the chain so a failing transaction doesn't
    // poison the next one; the original promise still propagates to
    // the caller via `next`.
    this.currentChain = next.catch(() => undefined);
    return next;
  }
}
