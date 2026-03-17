import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailAccountsRepository } from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { createImapClient } from '@/services/email/imap-client.service';
import { getImapIdleManager } from '@/services/email/imap-idle-manager';
import type { SmtpClientService } from '@/services/email/smtp-client.service';
import { getEmailSyncQueueInstance } from '@/workers/queues/email-sync.queue';
import { logger } from '@/lib/logger';

interface CheckEmailAccountHealthRequest {
  tenantId: string;
  userId: string;
  accountId: string;
}

interface ServiceHealth {
  status: string;
  latencyMs?: number;
  error: string | null;
}

interface ImapHealth extends ServiceHealth {
  status: 'connected' | 'error';
  latencyMs: number;
}

interface SmtpHealth extends ServiceHealth {
  status: 'connected' | 'error';
  latencyMs: number;
}

interface WorkerHealth extends ServiceHealth {
  status: 'active' | 'stale' | 'error';
  lastSyncAt: string | null;
  lastJobState: string | null;
  idleStatus: 'idle' | 'syncing' | 'degraded' | 'disconnected';
}

export interface EmailAccountHealthResult {
  imap: ImapHealth;
  smtp: SmtpHealth;
  worker: WorkerHealth;
}

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export class CheckEmailAccountHealthUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private credentialCipherService: CredentialCipherService,
    private smtpClientService: SmtpClientService,
  ) {}

  async execute(
    request: CheckEmailAccountHealthRequest,
  ): Promise<EmailAccountHealthResult> {
    const account = await this.emailAccountsRepository.findById(
      request.accountId,
      request.tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === request.userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        request.accountId,
        request.userId,
      );

      if (!access || !access.canManage) {
        throw new ForbiddenError(
          'You do not have access to check this account health',
        );
      }
    }

    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const [imapResult, smtpResult, workerResult] = await Promise.allSettled([
      this.checkImap(account, secret),
      this.checkSmtp(account, secret),
      this.checkWorker(request.accountId, account.lastSyncAt),
    ]);

    const imap: ImapHealth =
      imapResult.status === 'fulfilled'
        ? imapResult.value
        : { status: 'error', latencyMs: 0, error: imapResult.reason?.message ?? 'Unknown error' };

    const smtp: SmtpHealth =
      smtpResult.status === 'fulfilled'
        ? smtpResult.value
        : { status: 'error', latencyMs: 0, error: smtpResult.reason?.message ?? 'Unknown error' };

    const worker: WorkerHealth =
      workerResult.status === 'fulfilled'
        ? workerResult.value
        : { status: 'error', lastSyncAt: null, lastJobState: null, idleStatus: 'disconnected', error: workerResult.reason?.message ?? 'Unknown error' };

    return { imap, smtp, worker };
  }

  private async checkImap(
    account: { imapHost: string; imapPort: number; imapSecure: boolean; username: string; tlsVerify: boolean },
    secret: string,
  ): Promise<ImapHealth> {
    const start = Date.now();

    try {
      const client = createImapClient({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.username,
        secret,
        rejectUnauthorized: account.tlsVerify,
      });

      try {
        await client.connect();
        await client.list();
      } finally {
        await client.logout().catch(() => undefined);
      }

      return {
        status: 'connected',
        latencyMs: Date.now() - start,
        error: null,
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logger.warn({ err, host: account.imapHost }, 'Health check IMAP failed');
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        error: detail,
      };
    }
  }

  private async checkSmtp(
    account: { smtpHost: string; smtpPort: number; smtpSecure: boolean; username: string; tlsVerify: boolean },
    secret: string,
  ): Promise<SmtpHealth> {
    const start = Date.now();

    try {
      await this.smtpClientService.testConnection({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpSecure,
        username: account.username,
        secret,
        rejectUnauthorized: account.tlsVerify,
      });

      return {
        status: 'connected',
        latencyMs: Date.now() - start,
        error: null,
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logger.warn({ err, host: account.smtpHost }, 'Health check SMTP failed');
      return {
        status: 'error',
        latencyMs: Date.now() - start,
        error: detail,
      };
    }
  }

  private async checkWorker(
    accountId: string,
    lastSyncAt: Date | null,
  ): Promise<WorkerHealth> {
    const idleStatus = getImapIdleManager().getStatus(accountId);

    try {
      const queue = getEmailSyncQueueInstance();
      const jobs = await queue.getJobs(
        ['completed', 'failed', 'active', 'waiting', 'delayed'],
        0,
        50,
      );

      // Find the most recent job for this account
      const accountJobs = jobs.filter(
        (job) => job.data?.accountId === accountId,
      );

      let lastJobState: string | null = null;

      if (accountJobs.length > 0) {
        const latestJob = accountJobs[0];
        const state = await latestJob.getState();
        lastJobState = state;
      }

      // Determine worker status
      const lastSyncIso = lastSyncAt ? lastSyncAt.toISOString() : null;

      if (lastJobState === 'failed') {
        return {
          status: 'error',
          lastSyncAt: lastSyncIso,
          lastJobState,
          idleStatus,
          error: 'Último job de sincronização falhou',
        };
      }

      if (!lastSyncAt) {
        // Never synced — could be a new account
        return {
          status: accountJobs.length === 0 ? 'error' : 'active',
          lastSyncAt: null,
          lastJobState,
          idleStatus,
          error: accountJobs.length === 0 ? 'Nenhum job de sincronização encontrado' : null,
        };
      }

      const elapsed = Date.now() - lastSyncAt.getTime();

      if (elapsed > STALE_THRESHOLD_MS) {
        return {
          status: 'stale',
          lastSyncAt: lastSyncIso,
          lastJobState,
          idleStatus,
          error: null,
        };
      }

      return {
        status: 'active',
        lastSyncAt: lastSyncIso,
        lastJobState,
        idleStatus,
        error: null,
      };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      logger.warn({ err, accountId }, 'Health check Worker failed');
      return {
        status: 'error',
        lastSyncAt: lastSyncAt ? lastSyncAt.toISOString() : null,
        lastJobState: null,
        idleStatus,
        error: detail,
      };
    }
  }
}
