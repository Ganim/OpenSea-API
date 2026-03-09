import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailFolderType } from '@/entities/email/email-folder';
import { logger } from '@/lib/logger';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
  EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { getImapConnectionPool } from '@/services/email/imap-connection-pool';
import type { CreatedMessageRef } from './sync-email-folder';
import { SyncEmailFolderUseCase } from './sync-email-folder';

interface SyncEmailAccountRequest {
  tenantId: string;
  accountId: string;
}

interface SyncEmailAccountResponse {
  syncedFolders: number;
  syncedMessages: number;
}

export interface EmailSyncNotificationService {
  notifyNewMessages(params: {
    tenantId: string;
    accountId: string;
    accountAddress: string;
    ownerUserId: string;
    syncedMessages: number;
    messages?: CreatedMessageRef[];
  }): Promise<void>;
}

interface ImapMailbox {
  path: string;
  name?: string;
  specialUse?: string | string[];
}

function resolveFolderType(mailbox: ImapMailbox): EmailFolderType | undefined {
  const special = mailbox.specialUse;
  const values = Array.isArray(special) ? special : special ? [special] : [];

  if (values.includes('\\Inbox') || mailbox.path.toUpperCase() === 'INBOX') {
    return 'INBOX';
  }
  if (values.includes('\\Sent')) return 'SENT';
  if (values.includes('\\Drafts')) return 'DRAFTS';
  if (values.includes('\\Trash')) return 'TRASH';
  if (values.includes('\\Junk') || values.includes('\\Spam')) return 'SPAM';

  return 'CUSTOM';
}

export class SyncEmailAccountUseCase {
  private syncEmailFolderUseCase: SyncEmailFolderUseCase;

  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private credentialCipherService: CredentialCipherService,
    private emailSyncNotificationService?: EmailSyncNotificationService,
  ) {
    this.syncEmailFolderUseCase = new SyncEmailFolderUseCase(
      emailFoldersRepository,
      emailMessagesRepository,
      credentialCipherService,
    );
  }

  async execute(
    request: SyncEmailAccountRequest,
  ): Promise<SyncEmailAccountResponse> {
    const { tenantId, accountId } = request;

    const account = await this.emailAccountsRepository.findById(
      accountId,
      tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    if (!account.isActive) {
      throw new BadRequestError('Email account is not active');
    }

    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const pool = getImapConnectionPool();
    const client = await pool.acquire(accountId, {
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      rejectUnauthorized: account.tlsVerify,
    });

    let syncedFolders = 0;
    let syncedMessages = 0;
    const allCreatedMessages: CreatedMessageRef[] = [];

    try {

      const mailboxes = (await client.list()) as ImapMailbox[];

      for (const mailbox of mailboxes) {
        const remoteName = mailbox.path;
        const displayName = mailbox.name ?? mailbox.path;
        const type = resolveFolderType(mailbox);

        try {
          const existing = await this.emailFoldersRepository.findByRemoteName(
            account.id.toString(),
            remoteName,
          );

          const folder = existing
            ? await this.emailFoldersRepository.update({
                id: existing.id.toString(),
                accountId: account.id.toString(),
                displayName,
                type,
              })
            : await this.emailFoldersRepository.create({
                accountId: account.id.toString(),
                remoteName,
                displayName,
                type,
              });

          if (!folder) {
            continue;
          }

          const syncResult = await this.syncEmailFolderUseCase.execute({
            account,
            folder,
            client,
          });

          syncedFolders += 1;
          syncedMessages += syncResult.synced;
          allCreatedMessages.push(...syncResult.createdMessages);
        } catch (folderError) {
          // Log and continue — one folder failure must not block the entire sync
          logger.warn(
            {
              err: folderError,
              accountId: account.id.toString(),
              remoteName,
              displayName,
            },
            'Failed to sync folder, continuing with next folder',
          );
        }
      }

      await this.emailAccountsRepository.update({
        id: account.id.toString(),
        tenantId: account.tenantId.toString(),
        lastSyncAt: new Date(),
      });

      if (syncedMessages > 0 && this.emailSyncNotificationService) {
        await this.emailSyncNotificationService
          .notifyNewMessages({
            tenantId,
            accountId: account.id.toString(),
            accountAddress: account.address,
            ownerUserId: account.ownerUserId.toString(),
            syncedMessages,
            messages: allCreatedMessages,
          })
          .catch(() => undefined);
      }

      return { syncedFolders, syncedMessages };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.error(
        { err: error, tenantId, accountId },
        'Failed to sync email account',
      );
      console.error('[Email Sync] Failed to sync email account:', reason);
      pool.destroy(accountId);
      throw new BadRequestError(`Failed to sync email account: ${reason}`);
    } finally {
      pool.release(accountId);
    }
  }
}
