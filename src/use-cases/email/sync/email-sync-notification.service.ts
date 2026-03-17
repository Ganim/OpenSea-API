import { logger } from '@/lib/logger';
import type { EmailAccountsRepository } from '@/repositories/email';
import { getNotificationSuppressor } from '@/services/email/notification-suppressor.service';
import { makeCreateFromTemplateUseCase } from '@/use-cases/notifications/factories/make-create-from-template-use-case';
import type { CreatedMessageRef } from './sync-email-folder';
import type { EmailSyncNotificationService } from './sync-email-account';

/**
 * Threshold: if the sync produced at most this many new messages,
 * each message gets its own notification.  Above this limit a single
 * batch notification is created instead to avoid flooding the user.
 */
const PER_EMAIL_THRESHOLD = 5;

export class EmailSyncNotificationServiceImpl
  implements EmailSyncNotificationService
{
  constructor(private emailAccountsRepository: EmailAccountsRepository) {}

  async notifyNewMessages(params: {
    tenantId: string;
    accountId: string;
    accountAddress: string;
    ownerUserId: string;
    syncedMessages: number;
    messages?: CreatedMessageRef[];
  }): Promise<void> {
    // ── Filter out suppressed messages (user-initiated actions) ─────
    const suppressor = getNotificationSuppressor();
    const rawMessages = params.messages ?? [];
    const genuineMessages: CreatedMessageRef[] = [];

    for (const msg of rawMessages) {
      const suppressed = await suppressor
        .isSuppressed(
          params.accountId,
          'INBOX',
          msg.remoteUid?.toString() ?? msg.id,
        )
        .catch(() => false);

      if (!suppressed) {
        genuineMessages.push(msg);
      }
    }

    if (genuineMessages.length === 0) return; // All suppressed, nothing to notify

    // ── Resolve all users who should receive notifications ──────────
    const accessList = await this.emailAccountsRepository.listAccess(
      params.accountId,
      params.tenantId,
    );

    const recipientIds = new Set<string>([params.ownerUserId]);
    accessList
      .filter((access) => access.canRead)
      .forEach((access) => recipientIds.add(access.userId));

    const recipients = [...recipientIds];
    const createFromTemplate = makeCreateFromTemplateUseCase();

    const useBatch =
      genuineMessages.length === 0 ||
      genuineMessages.length > PER_EMAIL_THRESHOLD;

    try {
      if (useBatch) {
        // ── Batch notification ─────────────────────────────────────
        await Promise.all(
          recipients.map((userId) =>
            createFromTemplate
              .execute({
                templateCode: 'email.new_messages_batch',
                userId,
                variables: {
                  accountAddress: params.accountAddress,
                  count: genuineMessages.length,
                },
                channel: 'IN_APP',
                actionUrl: '/email?aid=central',
                actionText: 'Abrir caixa de entrada',
                entityType: 'email_account',
                entityId: params.accountId,
                metadata: {
                  accountAddress: params.accountAddress,
                  count: genuineMessages.length,
                },
              })
              .catch((err) => {
                logger.warn(
                  { err, userId, accountId: params.accountId },
                  'Failed to create batch email notification',
                );
              }),
          ),
        );
      } else {
        // ── Per-email notifications ────────────────────────────────
        await Promise.all(
          recipients.flatMap((userId) =>
            genuineMessages.map((msg) =>
              createFromTemplate
                .execute({
                  templateCode: 'email.new_message',
                  userId,
                  variables: {
                    senderName:
                      msg.fromName ?? msg.fromAddress ?? 'Desconhecido',
                    subject: msg.subject || '(sem assunto)',
                  },
                  channel: 'IN_APP',
                  actionUrl: `/email?mid=${msg.id}`,
                  actionText: 'Abrir e-mail',
                  entityType: 'email_message',
                  entityId: msg.id,
                  metadata: {
                    senderName: msg.fromName,
                    senderAddress: msg.fromAddress,
                    subject: msg.subject,
                    receivedAt: msg.receivedAt.toISOString(),
                    messageId: msg.id,
                  },
                })
                .catch((err) => {
                  logger.warn(
                    {
                      err,
                      userId,
                      messageId: msg.id,
                      accountId: params.accountId,
                    },
                    'Failed to create per-email notification',
                  );
                }),
            ),
          ),
        );
      }
    } catch (error) {
      logger.error(
        { err: error, accountId: params.accountId },
        'Email sync notification service failed',
      );
    }
  }
}
