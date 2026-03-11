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

const MAX_FOLDER_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    // B1: Decrypt with key rotation support
    const decryptResult = this.credentialCipherService.decryptWithRotation(
      account.encryptedSecret,
    );

    // If decrypted with previous key, re-encrypt with current key
    if (decryptResult.needsReEncrypt) {
      const newEncrypted = this.credentialCipherService.encrypt(
        decryptResult.plainText,
      );
      await this.emailAccountsRepository.update({
        id: account.id.toString(),
        tenantId: account.tenantId.toString(),
        encryptedSecret: newEncrypted,
      });
      logger.info(
        { accountId: account.id.toString() },
        'Re-encrypted credential with current key after rotation',
      );
    }

    const pool = getImapConnectionPool();
    const client = await pool.acquire(accountId, {
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret: decryptResult.plainText,
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

        // B3: Retry with exponential backoff per folder
        let lastError: unknown = null;
        for (let attempt = 0; attempt <= MAX_FOLDER_RETRIES; attempt++) {
          try {
            if (attempt > 0) {
              const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
              logger.debug(
                {
                  accountId: account.id.toString(),
                  remoteName,
                  attempt,
                  delay,
                },
                'Retrying folder sync after backoff',
              );
              await sleep(delay);
            }

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
              break; // No folder returned, skip
            }

            const syncResult = await this.syncEmailFolderUseCase.execute({
              account,
              folder,
              client,
            });

            syncedFolders += 1;
            syncedMessages += syncResult.synced;
            allCreatedMessages.push(...syncResult.createdMessages);
            lastError = null;
            break; // Success — move to next folder
          } catch (folderError) {
            lastError = folderError;
          }
        }

        if (lastError) {
          logger.warn(
            {
              err: lastError,
              accountId: account.id.toString(),
              remoteName,
              displayName,
              retries: MAX_FOLDER_RETRIES,
            },
            'Failed to sync folder after retries, continuing with next folder',
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
      pool.destroy(accountId);
      throw new BadRequestError(`Failed to sync email account: ${reason}`);
    } finally {
      pool.release(accountId);
    }
  }
}
