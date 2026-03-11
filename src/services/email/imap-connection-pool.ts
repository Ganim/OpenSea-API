import { createCircuitBreaker } from '@/lib/circuit-breaker';
import { logger } from '@/lib/logger';
import type CircuitBreaker from 'opossum';
import type { ImapFlow } from 'imapflow';
import { createImapClient } from './imap-client.service';

export interface ImapPoolConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  secret: string;
  rejectUnauthorized?: boolean;
}

interface PoolEntry {
  client: ImapFlow;
  config: ImapPoolConfig;
  accountId: string;
  inUse: boolean;
  lastUsedAt: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

interface WaitingRequest {
  resolve: (entry: PoolEntry) => void;
  reject: (err: Error) => void;
}

const DEFAULT_IDLE_TTL_MS = 60_000; // 60s idle before closing
const ACQUIRE_TIMEOUT_MS = 30_000; // 30s max wait for a busy connection

/**
 * IMAP Connection Pool — reuses connections per accountId.
 *
 * Each account gets at most one connection. If a second caller tries to
 * acquire the same account while it is in use, it waits in a FIFO queue.
 *
 * After release, the connection stays alive for `idleTtlMs` so the next
 * operation can reuse it without a full TCP+TLS handshake.
 */
export class ImapConnectionPool {
  private pool = new Map<string, PoolEntry>();
  private waitQueues = new Map<string, WaitingRequest[]>();
  private idleTtlMs: number;
  private connectBreakers = new Map<
    string,
    CircuitBreaker<[string, ImapPoolConfig], ImapFlow>
  >();

  constructor(idleTtlMs = DEFAULT_IDLE_TTL_MS) {
    this.idleTtlMs = idleTtlMs;
  }

  /**
   * Acquire an IMAP connection for the given account.
   * Returns an ImapFlow that is already connected.
   */
  async acquire(accountId: string, config: ImapPoolConfig): Promise<ImapFlow> {
    const existing = this.pool.get(accountId);

    if (existing && !existing.inUse) {
      // Reuse idle connection
      this.clearIdleTimer(existing);
      existing.inUse = true;
      existing.lastUsedAt = Date.now();

      // Verify the connection is still alive
      if (existing.client.usable) {
        logger.debug({ accountId }, 'IMAP pool: reusing idle connection');
        return existing.client;
      }

      // Connection is dead — remove and create new
      logger.debug(
        { accountId },
        'IMAP pool: idle connection dead, creating new',
      );
      this.destroyEntry(existing);
    }

    if (existing && existing.inUse) {
      // Wait in queue for the connection to be released
      logger.debug({ accountId }, 'IMAP pool: connection busy, queuing');
      return this.waitForRelease(accountId, config);
    }

    // Create new connection
    return this.createAndStore(accountId, config);
  }

  /**
   * Release an IMAP connection back to the pool.
   * The connection stays idle for `idleTtlMs` before being closed.
   */
  release(accountId: string): void {
    const entry = this.pool.get(accountId);
    if (!entry) return;

    // Check if someone is waiting for this connection
    const queue = this.waitQueues.get(accountId);
    if (queue && queue.length > 0) {
      const next = queue.shift()!;
      if (queue.length === 0) this.waitQueues.delete(accountId);
      entry.lastUsedAt = Date.now();
      // Connection stays inUse, transfer to next caller
      next.resolve(entry);
      return;
    }

    // No one waiting — mark as idle with TTL
    entry.inUse = false;
    entry.lastUsedAt = Date.now();
    entry.idleTimer = setTimeout(() => {
      logger.debug({ accountId }, 'IMAP pool: idle TTL expired, closing');
      this.destroy(accountId);
    }, this.idleTtlMs);
  }

  /**
   * Forcefully close and remove a connection from the pool.
   */
  destroy(accountId: string): void {
    const entry = this.pool.get(accountId);
    if (!entry) return;
    this.destroyEntry(entry);
    this.rejectWaiters(accountId, new Error('Connection destroyed'));
  }

  /**
   * Close all connections (for graceful shutdown).
   */
  async destroyAll(): Promise<void> {
    const accountIds = [...this.pool.keys()];
    for (const accountId of accountIds) {
      this.destroy(accountId);
    }
  }

  /** Number of connections currently in the pool. */
  get size(): number {
    return this.pool.size;
  }

  /** Check if a connection exists for an account. */
  has(accountId: string): boolean {
    return this.pool.has(accountId);
  }

  private async createAndStore(
    accountId: string,
    config: ImapPoolConfig,
  ): Promise<ImapFlow> {
    // B2: Circuit breaker per host — prevents hammering a failing mail server
    const breakerKey = `imap:${config.host}:${config.port}`;
    let breaker = this.connectBreakers.get(breakerKey);

    if (!breaker) {
      breaker = createCircuitBreaker(
        (_acctId: string, cfg: ImapPoolConfig) =>
          this.doCreateAndStore(_acctId, cfg),
        { name: breakerKey, type: 'external' },
      );
      this.connectBreakers.set(breakerKey, breaker);
    }

    return breaker.fire(accountId, config);
  }

  private async doCreateAndStore(
    accountId: string,
    config: ImapPoolConfig,
  ): Promise<ImapFlow> {
    const client = createImapClient({
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      secret: config.secret,
      rejectUnauthorized: config.rejectUnauthorized,
    });

    const entry: PoolEntry = {
      client,
      config,
      accountId,
      inUse: true,
      lastUsedAt: Date.now(),
      idleTimer: null,
    };

    // If the connection drops unexpectedly, clean up
    client.on('close', () => {
      logger.debug({ accountId }, 'IMAP pool: connection closed by server');
      if (this.pool.get(accountId) === entry) {
        this.pool.delete(accountId);
        this.clearIdleTimer(entry);
      }
    });

    this.pool.set(accountId, entry);

    try {
      await client.connect();
      logger.debug(
        { accountId, host: config.host },
        'IMAP pool: new connection created',
      );
      return client;
    } catch (err) {
      this.pool.delete(accountId);
      throw err;
    }
  }

  private waitForRelease(
    accountId: string,
    config: ImapPoolConfig,
  ): Promise<ImapFlow> {
    return new Promise<ImapFlow>((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const queue = this.waitQueues.get(accountId);
        if (queue) {
          const idx = queue.findIndex((w) => w.resolve === resolveWrapper);
          if (idx >= 0) queue.splice(idx, 1);
          if (queue.length === 0) this.waitQueues.delete(accountId);
        }
        reject(
          new Error(`IMAP pool: acquire timeout for account ${accountId}`),
        );
      }, ACQUIRE_TIMEOUT_MS);

      const resolveWrapper = (entry: PoolEntry) => {
        clearTimeout(timeout);
        if (entry.client.usable) {
          resolve(entry.client);
        } else {
          // Connection died while waiting — create new
          this.destroyEntry(entry);
          this.createAndStore(accountId, config).then(resolve, reject);
        }
      };

      const rejectWrapper = (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      };

      if (!this.waitQueues.has(accountId)) {
        this.waitQueues.set(accountId, []);
      }
      this.waitQueues.get(accountId)!.push({
        resolve: resolveWrapper,
        reject: rejectWrapper,
      });
    });
  }

  private destroyEntry(entry: PoolEntry): void {
    this.clearIdleTimer(entry);
    this.pool.delete(entry.accountId);
    entry.client.logout().catch(() => undefined);
  }

  private clearIdleTimer(entry: PoolEntry): void {
    if (entry.idleTimer) {
      clearTimeout(entry.idleTimer);
      entry.idleTimer = null;
    }
  }

  private rejectWaiters(accountId: string, error: Error): void {
    const queue = this.waitQueues.get(accountId);
    if (queue) {
      for (const waiter of queue) {
        waiter.reject(error);
      }
      this.waitQueues.delete(accountId);
    }
  }
}

// Singleton instance
let poolInstance: ImapConnectionPool | null = null;

export function getImapConnectionPool(): ImapConnectionPool {
  if (!poolInstance) {
    poolInstance = new ImapConnectionPool();
  }
  return poolInstance;
}

/** For testing: reset the singleton. */
export function resetImapConnectionPool(): void {
  if (poolInstance) {
    poolInstance.destroyAll().catch(() => undefined);
    poolInstance = null;
  }
}
