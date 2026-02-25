import type { EmailAccountsRepository } from '@/repositories/email';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';
import type { EmailSyncNotificationService } from './sync-email-account';

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
  }): Promise<void> {
    const accessList = await this.emailAccountsRepository.listAccess(
      params.accountId,
      params.tenantId,
    );

    const recipientIds = new Set<string>([params.ownerUserId]);
    accessList
      .filter((access) => access.canRead)
      .forEach((access) => recipientIds.add(access.userId));

    const createNotificationUseCase = makeCreateNotificationUseCase();
    const messageCountLabel =
      params.syncedMessages === 1
        ? '1 nova mensagem'
        : `${params.syncedMessages} novas mensagens`;

    await Promise.all(
      [...recipientIds].map(async (userId) => {
        await createNotificationUseCase.execute({
          userId,
          title: 'Novos e-mails sincronizados',
          message: `A conta ${params.accountAddress} recebeu ${messageCountLabel}.`,
          type: 'INFO',
          priority: 'NORMAL',
          channel: 'IN_APP',
          actionUrl: '/email',
          actionText: 'Abrir caixa de entrada',
          entityType: 'email_account',
          entityId: params.accountId,
        });
      }),
    );
  }
}
