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

interface CreatedMessageRef {
  id: string;
  remoteUid: number;
  receivedAt: Date;
}

async function processMessages(
  messages: AsyncIterable<unknown>,
  account: EmailAccount,
  folder: EmailFolder,
  emailMessagesRepository: EmailMessagesRepository,
): Promise<{ synced: number; maxUid: number; createdMessages: CreatedMessageRef[] }> {
  let synced = 0;
  let maxUid = folder.lastUid ?? 0;
  const createdMessages: CreatedMessageRef[] = [];

  for await (const rawMessage of messages) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = rawMessage as any;
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

    const created = await emailMessagesRepository.create({
      tenantId: account.tenantId.toString(),
      accountId: account.id.toString(),
      folderId: folder.id.toString(),
      remoteUid: uid,
      messageId: envelope?.messageId ?? null,
      threadId: envelope?.inReplyTo ?? null,
      fromAddress: from?.address ?? '',
      fromName: from?.name ?? null,
      toAddresses: (to as Array<{ address?: string }>)
        .map((item) => item.address ?? '')
        .filter(Boolean),
      ccAddresses: (cc as Array<{ address?: string }>)
        .map((item) => item.address ?? '')
        .filter(Boolean),
      bccAddresses: (bcc as Array<{ address?: string }>)
        .map((item) => item.address ?? '')
        .filter(Boolean),
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

    createdMessages.push({
      id: created.id.toString(),
      remoteUid: uid,
      receivedAt: created.receivedAt,
    });

    maxUid = Math.max(maxUid, uid);
    synced += 1;
  }

  return { synced, maxUid, createdMessages };
}

const SNIPPET_BATCH_LIMIT = 50;

async function generateSnippets(
  client: ImapFlow,
  createdMessages: CreatedMessageRef[],
  folderId: string,
  emailMessagesRepository: EmailMessagesRepository,
): Promise<void> {
  if (createdMessages.length === 0) return;

  // Pick the 50 most recent messages (by receivedAt desc)
  const candidates = [...createdMessages]
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
    .slice(0, SNIPPET_BATCH_LIMIT);

  logger.debug(
    { folderId, total: createdMessages.length, candidates: candidates.length },
    'Starting snippet generation for newly synced messages',
  );

  let generated = 0;

  for (const msg of candidates) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let textContent: string | undefined;

      // First attempt: fetch text/plain body part '1' (works for simple and multipart messages)
      try {
        const bodyPart = await client.fetchOne(
          msg.remoteUid.toString(),
          { bodyParts: ['1'] },
          { uid: true },
        );

        if (bodyPart && bodyPart.bodyParts) {
          const value = bodyPart.bodyParts.values().next().value;
          textContent = value instanceof Buffer
            ? value.toString('utf-8')
            : typeof value === 'string'
              ? value
              : undefined;
        }
      } catch {
        // Part '1' not available — fall through to source fallback
      }

      // Fallback: fetch raw source with a size limit and extract plain text lines
      if (!textContent) {
        try {
          const sourcePart = await client.fetchOne(
            msg.remoteUid.toString(),
            { source: { start: 0, maxLength: 4096 } },
            { uid: true },
          );

          if (sourcePart && sourcePart.source) {
            const raw = sourcePart.source instanceof Buffer
              ? sourcePart.source.toString('utf-8')
              : String(sourcePart.source);

            // Strip MIME headers (everything before first blank line)
            const bodyStart = raw.indexOf('\r\n\r\n');
            const rawBody = bodyStart !== -1 ? raw.substring(bodyStart + 4) : raw;
            textContent = rawBody.replace(/=\r?\n/g, '').replace(/<[^>]+>/g, ' ');
          }
        } catch {
          // Source fetch also failed — skip this message
        }
      }

      if (textContent) {
        const snippet = textContent
          .replace(/\r?\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 200);

        if (snippet) {
          await emailMessagesRepository.updateBody(msg.id, null, null, snippet);
          generated += 1;
        }
      }
    } catch {
      // Snippet generation is best-effort — never block sync
    }
  }

  logger.debug(
    { folderId, generated, candidates: candidates.length },
    'Snippet generation complete',
  );
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
    const allCreatedMessages: CreatedMessageRef[] = [];

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
          allCreatedMessages.push(...result.createdMessages);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);

          // Check for IMAP messageset error (can be in error.message or in error.responseText)
          const responseText =
            (error as { responseText?: string })?.responseText ?? '';
          const commandResponse =
            (error as { response?: { attributes?: Array<{ value?: string }> } })
              ?.response?.attributes?.[0]?.value ?? '';

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
            allCreatedMessages.push(...retryResult.createdMessages);
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

        // Generate snippets for the 50 most recent newly-synced messages.
        // This is done after the main sync loop so it never delays message creation.
        // Failures are silently swallowed inside generateSnippets.
        if (allCreatedMessages.length > 0) {
          await generateSnippets(
            client,
            allCreatedMessages,
            folder.id.toString(),
            this.emailMessagesRepository,
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
