import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { EmailAccount } from '@/entities/email/email-account';
import type { EmailFolder } from '@/entities/email/email-folder';
import { logger } from '@/lib/logger';
import type {
  EmailFoldersRepository,
  EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { ImapFlow } from 'imapflow';

interface SyncEmailFolderRequest {
  account: EmailAccount;
  folder: EmailFolder;
  client?: ImapFlow;
}

interface SyncEmailFolderResponse {
  synced: number;
  lastUid: number | null;
}

function hasAttachmentFromStructure(structure: unknown): boolean {
  if (!structure || typeof structure !== 'object') return false;
  const part = structure as {
    childNodes?: unknown[];
    disposition?: { type?: string; params?: Record<string, string> };
  };

  if (part.disposition?.type === 'attachment') return true;
  if (
    part.disposition?.type === 'inline' &&
    part.disposition?.params?.filename
  ) {
    return true;
  }

  if (Array.isArray(part.childNodes)) {
    return part.childNodes.some(hasAttachmentFromStructure);
  }

  return false;
}

function normalizeImapInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  return null;
}

async function processMessages(
  messages: AsyncIterable<unknown>,
  account: EmailAccount,
  folder: EmailFolder,
  emailMessagesRepository: EmailMessagesRepository,
): Promise<{ synced: number; maxUid: number }> {
  let synced = 0;
  let maxUid = folder.lastUid ?? 0;

  for await (const message of messages) {
    const uid = message.uid ?? 0;
    if (!uid) continue;

    const existing = await emailMessagesRepository.findByRemoteUid(
      account.id.toString(),
      folder.id.toString(),
      uid,
    );

    if (existing) {
      maxUid = Math.max(maxUid, uid);
      continue;
    }

    const envelope = message.envelope ?? undefined;
    const from = envelope?.from?.[0];
    const to = envelope?.to ?? [];
    const cc = envelope?.cc ?? [];
    const bcc = envelope?.bcc ?? [];
    const flags = new Set((message.flags ?? []) as string[]);

    const hasAttachments = hasAttachmentFromStructure(message.bodyStructure);

    await emailMessagesRepository.create({
      tenantId: account.tenantId.toString(),
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: uid,
      messageId: envelope?.messageId ?? null,
      threadId: envelope?.inReplyTo ?? null,
      fromAddress: from?.address ?? '',
      fromName: from?.name ?? null,
      toAddresses: to.map((item) => item.address ?? '').filter(Boolean),
      ccAddresses: cc.map((item) => item.address ?? '').filter(Boolean),
      bccAddresses: bcc.map((item) => item.address ?? '').filter(Boolean),
      subject: envelope?.subject ?? '',
      snippet: null,
      bodyText: null,
      bodyHtmlSanitized: null,
      receivedAt: message.internalDate ?? new Date(),
      sentAt: envelope?.date ?? null,
      isRead: flags.has('\\Seen'),
      isFlagged: flags.has('\\Flagged'),
      hasAttachments,
    });

    maxUid = Math.max(maxUid, uid);
    synced += 1;
  }

  return { synced, maxUid };
}

export class SyncEmailFolderUseCase {
  constructor(
    private emailFoldersRepository: EmailFoldersRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(
    request: SyncEmailFolderRequest,
  ): Promise<SyncEmailFolderResponse> {
    const { account, folder } = request;
    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const client =
      request.client ??
      new ImapFlow({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        auth: {
          user: account.username,
          pass: secret,
        },
        logger: false,
      });

    let synced = 0;
    let maxUid = folder.lastUid ?? 0;

    try {
      if (!request.client) {
        await client.connect();
      }

      const lock = await client.getMailboxLock(folder.remoteName);
      try {
        const status = await client.status(folder.remoteName, {
          uidNext: true,
          uidValidity: true,
        });

        const uidValidityValue = normalizeImapInt(status.uidValidity);

        const uidNextValue = normalizeImapInt(status.uidNext);

        const uidValidityChanged =
          folder.uidValidity !== null &&
          uidValidityValue !== null &&
          folder.uidValidity !== uidValidityValue;

        const lastUid = uidValidityChanged ? 0 : (folder.lastUid ?? 0);
        const fromUid = Math.max(lastUid + 1, 1);

        const range = `${fromUid}:*`;

        if (uidValidityValue !== null) {
          await this.emailFoldersRepository.update({
            id: folder.id.toString(),
            accountId: folder.accountId.toString(),
            uidValidity: uidValidityValue,
            lastUid: lastUid,
          });
        }

        // If uidNext is known and fromUid >= uidNext, there are no new messages
        if (uidNextValue !== null && fromUid >= uidNextValue) {
          logger.info(
            {
              accountId: account.id.toString(),
              folderId: folder.id.toString(),
              remoteName: folder.remoteName,
              lastUid,
              fromUid,
              uidNext: uidNextValue,
            },
            'No new messages to sync (fromUid >= uidNext)',
          );
          return { synced: 0, lastUid: folder.lastUid ?? null };
        }

        logger.info(
          {
            accountId: account.id.toString(),
            folderId: folder.id.toString(),
            remoteName: folder.remoteName,
            range,
            lastUid,
            fromUid,
          },
          'Starting IMAP fetch with range',
        );

        let shouldRetry = false;

        try {
          const messages = client.fetch(range, {
            uid: true,
            envelope: true,
            flags: true,
            internalDate: true,
            bodyStructure: true,
          });

          const result = await processMessages(
            messages,
            account,
            folder,
            this.emailMessagesRepository,
          );

          synced += result.synced;
          maxUid = result.maxUid;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          
          // Check for IMAP messageset error (can be in error.message or in error.responseText)
          const responseText =
            (error as { responseText?: string })?.responseText ?? '';
          const commandResponse =
            (error as { response?: { attributes?: Array<{ value?: string }> } })?.response?.attributes?.[0]
              ?.value ?? '';
          
          const isMessagesetError =
            errorMsg.includes('Invalid messageset') ||
            errorMsg.includes('messageset') ||
            responseText.includes('Invalid messageset') ||
            responseText.includes('messageset') ||
            commandResponse.includes('Invalid messageset') ||
            commandResponse.includes('messageset');

          if (isMessagesetError && !shouldRetry) {
            logger.warn(
              {
                accountId: account.id.toString(),
                folderId: folder.id.toString(),
                remoteName: folder.remoteName,
                range,
                error: errorMsg,
              },
              'IMAP invalid messageset, resetting to full sync',
            );

            // Reset lastUid to 0 and retry with full range
            await this.emailFoldersRepository.update({
              id: folder.id.toString(),
              accountId: folder.accountId.toString(),
              lastUid: 0,
            });

            shouldRetry = true;

            logger.info(
              {
                accountId: account.id.toString(),
                folderId: folder.id.toString(),
              },
              'Retrying with full sync (range: 1:*)',
            );

            const retryMessages = client.fetch('1:*', {
              uid: true,
              envelope: true,
              flags: true,
              internalDate: true,
              bodyStructure: true,
            });

            const retryResult = await processMessages(
              retryMessages,
              account,
              folder,
              this.emailMessagesRepository,
            );

            synced += retryResult.synced;
            maxUid = retryResult.maxUid;
          } else {
            throw error;
          }
        }

        if (synced > 0) {
          logger.info(
            {
              accountId: account.id.toString(),
              folderId: folder.id.toString(),
              remoteName: folder.remoteName,
              synced,
              maxUid,
            },
            'Email folder sync completed',
          );
        }

        await this.emailFoldersRepository.update({
          id: folder.id.toString(),
          accountId: folder.accountId.toString(),
          lastUid: (maxUid || folder.lastUid) ?? null,
        });
      } finally {
        lock.release();
      }

      return {
        synced,
        lastUid: (maxUid || folder.lastUid) ?? null,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.error(
        {
          err: error,
          accountId: account.id.toString(),
          folderId: folder.id.toString(),
          remoteName: folder.remoteName,
        },
        'Failed to sync email folder',
      );
      console.error('[Email Sync] Failed to sync email folder:', reason);
      throw new BadRequestError(`Failed to sync email folder: ${reason}`);
    } finally {
      if (!request.client) {
        await client.logout().catch(() => undefined);
      }
    }
  }
}
