import type { ImapFlow } from 'imapflow';
import { createImapClient } from './imap-client.service';
import type { ImapPoolConfig } from './imap-connection-pool';
import { logger } from '@/lib/logger';
import { queueEmailSync } from '@/workers/queues/email-sync.queue';

interface IdleEntry {
  client: ImapFlow;
  accountId: string;
  tenantId: string;
  config: ImapPoolConfig;
  state: 'connecting' | 'idle' | 'syncing' | 'degraded';
  retries: number;
  heartbeatTimer: ReturnType<typeof setInterval> | null;
}

const MAX_RETRIES = 3;
const HEARTBEAT_INTERVAL_MS = 29 * 60 * 1000; // 29 minutes (RFC 2177 recommends < 30 min)
const BACKOFF_SCHEDULE = [5_000, 10_000, 30_000, 60_000];

export class ImapIdleManager {
  private entries = new Map<string, IdleEntry>();
  private stopped = false;

  async startMonitoring(params: {
    id: string;
    tenantId: string;
    imapConfig: ImapPoolConfig;
  }): Promise<void> {
    if (this.stopped) return;
    if (this.entries.has(params.id)) {
      await this.stopMonitoring(params.id);
    }

    const entry: IdleEntry = {
      client: null as unknown as ImapFlow,
      accountId: params.id,
      tenantId: params.tenantId,
      config: params.imapConfig,
      state: 'connecting',
      retries: 0,
      heartbeatTimer: null,
    };
    this.entries.set(params.id, entry);

    await this.connect(entry);
  }

  private async connect(entry: IdleEntry): Promise<void> {
    if (this.stopped) return;

    try {
      entry.state = 'connecting';

      const client = createImapClient({
        host: entry.config.host,
        port: entry.config.port,
        secure: entry.config.secure,
        username: entry.config.username,
        secret: entry.config.secret,
        rejectUnauthorized: entry.config.rejectUnauthorized,
      });

      await client.connect();

      // Open INBOX for IDLE — ImapFlow enters IDLE automatically
      await client.mailboxOpen('INBOX');

      entry.client = client;
      entry.state = 'idle';
      entry.retries = 0;

      // Listen for new messages (ImapFlow emits 'exists' when IDLE detects changes)
      client.on(
        'exists',
        async (data: { path: string; count: number; prevCount: number }) => {
          if (entry.state === 'syncing' || this.stopped) return;

          entry.state = 'syncing';
          logger.info(
            {
              accountId: entry.accountId,
              newCount: data.count,
              prevCount: data.prevCount,
            },
            'IDLE: New messages detected, triggering sync',
          );

          // Queue an incremental sync via BullMQ
          await queueEmailSync({
            tenantId: entry.tenantId,
            accountId: entry.accountId,
          }).catch((err) => {
            logger.warn(
              { err, accountId: entry.accountId },
              'IDLE: Failed to queue sync',
            );
          });

          entry.state = 'idle';
        },
      );

      // Handle unexpected close
      client.on('close', () => {
        if (this.stopped) return;
        logger.warn(
          { accountId: entry.accountId },
          'IDLE: Connection closed unexpectedly',
        );
        this.scheduleReconnect(entry);
      });

      // Heartbeat: refresh IDLE before 30-min server timeout (RFC 2177)
      this.startHeartbeat(entry);

      logger.info(
        { accountId: entry.accountId },
        'IDLE: Monitoring started for INBOX',
      );
    } catch (err) {
      logger.warn(
        { err, accountId: entry.accountId },
        'IDLE: Failed to connect',
      );
      this.scheduleReconnect(entry);
    }
  }

  private startHeartbeat(entry: IdleEntry): void {
    if (entry.heartbeatTimer) clearInterval(entry.heartbeatTimer);

    entry.heartbeatTimer = setInterval(async () => {
      if (this.stopped || entry.state !== 'idle') return;

      try {
        // NOOP keeps the connection alive and resets IDLE timer
        if (entry.client?.usable) {
          await entry.client.noop();
        }
      } catch (err) {
        logger.warn(
          { err, accountId: entry.accountId },
          'IDLE: Heartbeat failed',
        );
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private scheduleReconnect(entry: IdleEntry): void {
    if (this.stopped) return;

    entry.retries++;

    if (entry.retries > MAX_RETRIES) {
      entry.state = 'degraded';
      logger.error(
        { accountId: entry.accountId, retries: entry.retries },
        'IDLE: Max retries reached, marking as degraded (falling back to polling)',
      );
      return;
    }

    const delay =
      BACKOFF_SCHEDULE[
        Math.min(entry.retries - 1, BACKOFF_SCHEDULE.length - 1)
      ];
    logger.info(
      { accountId: entry.accountId, retries: entry.retries, delay },
      'IDLE: Scheduling reconnect',
    );

    setTimeout(() => {
      if (!this.stopped && this.entries.has(entry.accountId)) {
        this.connect(entry).catch((err) => {
          logger.error(
            { err, accountId: entry.accountId },
            'IDLE: Reconnect failed',
          );
        });
      }
    }, delay);
  }

  async stopMonitoring(accountId: string): Promise<void> {
    const entry = this.entries.get(accountId);
    if (!entry) return;

    if (entry.heartbeatTimer) {
      clearInterval(entry.heartbeatTimer);
      entry.heartbeatTimer = null;
    }

    try {
      if (entry.client?.usable) {
        await entry.client.logout();
      }
    } catch {
      // ignore logout errors
    }

    this.entries.delete(accountId);
    logger.info({ accountId }, 'IDLE: Monitoring stopped');
  }

  async stopAll(): Promise<void> {
    this.stopped = true;
    const promises = [...this.entries.keys()].map((id) =>
      this.stopMonitoring(id),
    );
    await Promise.allSettled(promises);
    logger.info('IDLE: All monitoring stopped');
  }

  getStatus(
    accountId: string,
  ): 'idle' | 'syncing' | 'degraded' | 'disconnected' {
    const entry = this.entries.get(accountId);
    if (!entry) return 'disconnected';
    return entry.state === 'connecting' ? 'idle' : entry.state;
  }
}

let instance: ImapIdleManager | null = null;

export function getImapIdleManager(): ImapIdleManager {
  if (!instance) {
    instance = new ImapIdleManager();
  }
  return instance;
}
