import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { EmailAccount } from '@/entities/email/email-account';
import type { EmailFolder } from '@/entities/email/email-folder';
import { logger } from '@/lib/logger';
import type {
    EmailFoldersRepository,
    EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { createImapClient } from '@/services/email/imap-client.service';
import { Prisma } from '@prisma/generated/client.js';
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

/**
 * Detect attachments from ImapFlow BODYSTRUCTURE.
 *
 * ImapFlow's MessageStructureObject uses:
 *   - disposition: string ("attachment" | "inline"), NOT an object
 *   - dispositionParameters: { filename?, name?, ... }
 *   - type: full MIME type string ("image/png", "text/plain", "multipart/mixed")
 *   - parameters: Content-Type params like { name: "photo.png", charset: "utf-8" }
 *   - childNodes: sub-parts for multipart messages
 */
function hasAttachmentFromStructure(structure: unknown): boolean {
  if (!structure || typeof structure !== 'object') return false;

  const part = structure as {
    childNodes?: unknown[];
    disposition?: string;
    dispositionParameters?: Record<string, string>;
    type?: string;
    parameters?: Record<string, string>;
  };

  const disposition =
    typeof part.disposition === 'string'
      ? part.disposition.toLowerCase()
      : '';

  // Content-Disposition: attachment
  if (disposition === 'attachment') return true;

  // Content-Disposition: inline with filename → named inline = downloadable attachment
  if (disposition === 'inline') {
    const filename =
      part.dispositionParameters?.filename ??
      part.dispositionParameters?.name;
    if (filename) return true;
  }

  // Non-text, non-multipart MIME parts with a filename in Content-Type parameters.
  // Some email clients attach files without Content-Disposition, relying on
  // Content-Type: image/png; name="photo.png"
  const mimeType = part.type?.toLowerCase() ?? '';
  if (
    mimeType &&
    !mimeType.startsWith('multipart/') &&
    !mimeType.startsWith('text/')
  ) {
    const ctFilename = part.parameters?.name ?? part.parameters?.filename;
    if (ctFilename) return true;
  }

  // Recurse into child MIME parts (multipart/mixed, multipart/alternative, etc.)
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

const PROCESS_BATCH_SIZE = 200;

interface RawMessageData {
  uid: number;
  envelope: unknown;
  flags: string[];
  internalDate: Date | undefined;
  bodyStructure: unknown;
}

async function processMessages(
  messages: AsyncIterable<unknown>,
  account: EmailAccount,
  folder: EmailFolder,
  emailMessagesRepository: EmailMessagesRepository,
): Promise<{
  synced: number;
  maxUid: number;
  createdMessages: CreatedMessageRef[];
}> {
  let synced = 0;
  let maxUid = folder.lastUid ?? 0;
  const createdMessages: CreatedMessageRef[] = [];

  // Collect messages in batches and batch-check existence to avoid N+1 queries
  let batch: RawMessageData[] = [];

  async function processBatch(items: RawMessageData[]) {
    if (items.length === 0) return;

    const uids = items.map((m) => m.uid);
    const existingUids = await emailMessagesRepository.findExistingRemoteUids(
      account.id.toString(),
      folder.id.toString(),
      uids,
    );

    for (const message of items) {
      maxUid = Math.max(maxUid, message.uid);

      if (existingUids.has(message.uid)) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const envelope = (message as any).envelope ?? undefined;
      const from = envelope?.from?.[0];
      const to = envelope?.to ?? [];
      const cc = envelope?.cc ?? [];
      const bcc = envelope?.bcc ?? [];
      const flags = new Set(message.flags);
      const hasAttachments = hasAttachmentFromStructure(message.bodyStructure);

      const created = await emailMessagesRepository
        .create({
          tenantId: account.tenantId.toString(),
          accountId: account.id.toString(),
          folderId: folder.id.toString(),
          remoteUid: message.uid,
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
          isAnswered: flags.has('\\Answered'),
          hasAttachments,
        })
        .catch((err) => {
          // Skip duplicate messages (race condition between parallel syncs)
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            return null;
          }
          throw err;
        });

      if (!created) continue;

      createdMessages.push({
        id: created.id.toString(),
        remoteUid: message.uid,
        receivedAt: created.receivedAt,
      });

      synced += 1;
    }
  }

  for await (const rawMessage of messages) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = rawMessage as any;
    const uid = message.uid ?? 0;
    if (!uid) continue;

    batch.push({
      uid,
      envelope: message.envelope,
      flags: [...(message.flags ?? [])],
      internalDate: message.internalDate,
      bodyStructure: message.bodyStructure,
    });

    if (batch.length >= PROCESS_BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  // Process remaining messages
  await processBatch(batch);

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

  // Build a UID lookup map for O(1) access
  const uidToId = new Map(candidates.map((m) => [m.remoteUid, m.id]));
  const uidSet = candidates.map((m) => m.remoteUid.toString()).join(',');

  let generated = 0;

  // Batch fetch: single IMAP FETCH command for all UIDs at once
  // This replaces N individual fetchOne calls with 1 batch call
  try {
    const messages = client.fetch(uidSet, {
      uid: true,
      bodyParts: ['1'],
      source: { start: 0, maxLength: 4096 },
    }, { uid: true });

    for await (const rawMsg of messages) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = rawMsg as any;
      const uid = msg.uid as number;
      const dbId = uidToId.get(uid);
      if (!dbId) continue;

      try {
        let textContent: string | undefined;

        // Try body part '1' first (text/plain in simple or multipart messages)
        if (msg.bodyParts) {
          const value = msg.bodyParts.values().next().value;
          textContent =
            value instanceof Buffer
              ? value.toString('utf-8')
              : typeof value === 'string'
                ? value
                : undefined;
        }

        // Fallback: partial source
        if (!textContent && msg.source) {
          const raw =
            msg.source instanceof Buffer
              ? msg.source.toString('utf-8')
              : String(msg.source);

          const bodyStart = raw.indexOf('\r\n\r\n');
          const rawBody =
            bodyStart !== -1 ? raw.substring(bodyStart + 4) : raw;
          textContent = rawBody
            .replace(/=\r?\n/g, '')
            .replace(/<[^>]+>/g, ' ');
        }

        if (textContent) {
          const snippet = textContent
            .replace(/\r?\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);

          if (snippet) {
            await emailMessagesRepository.updateBody(dbId, null, null, snippet);
            generated += 1;
          }
        }
      } catch {
        // Skip individual message errors — snippet is best-effort
      }
    }
  } catch (err) {
    // Batch fetch failed — log and skip snippet generation entirely
    logger.warn(
      { err, folderId, uidCount: candidates.length },
      'Batch snippet fetch failed — skipping snippet generation',
    );
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
      createImapClient({
        host: account.imapHost,
        port: account.imapPort,
        secure: account.imapSecure,
        username: account.username,
        secret,
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

        // When uidValidity changes, old UIDs are invalid — soft-delete stale messages
        if (uidValidityChanged) {
          const deleted = await this.emailMessagesRepository.softDeleteByFolder(
            folder.id.toString(),
            account.tenantId.toString(),
          );
          if (deleted > 0) {
            logger.info(
              {
                accountId: account.id.toString(),
                folderId: folder.id.toString(),
                deleted,
              },
              'Soft-deleted stale messages after uidValidity change',
            );
          }
        }

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
