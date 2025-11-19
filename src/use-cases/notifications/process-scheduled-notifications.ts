import { prisma } from '@/lib/prisma';
import {
  notificationToDTO,
  type NotificationDTO,
} from '@/mappers/notifications/notification-to-dto';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import type { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';
import { EmailService } from '@/services/email-service';

interface ProcessScheduledNotificationsRequest {
  now?: Date; // para testes
  batchSize?: number;
}

interface ProcessScheduledNotificationsResponse {
  processed: number;
  sent: NotificationDTO[];
  errors: Array<{ id: string; error: string }>;
}

export class ProcessScheduledNotificationsUseCase {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private emailService: EmailService,
    private notificationPreferencesRepository?: NotificationPreferencesRepository,
  ) {}

  async execute(
    request: ProcessScheduledNotificationsRequest = {},
  ): Promise<ProcessScheduledNotificationsResponse> {
    const now = request.now ?? new Date();
    const batchSize = request.batchSize ?? 50;
    const pending = await this.notificationsRepository.listScheduledPending(
      now,
      batchSize,
    );

    const sent: NotificationDTO[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const notification of pending) {
      try {
        if (notification.channel !== 'EMAIL') {
          // Para outros canais (IN_APP já aparece automaticamente), apenas marcar como enviado
          notification.markSent();
          await this.notificationsRepository.save(notification);
          sent.push(notificationToDTO(notification));
          continue;
        }

        // Preferências: valida canal EMAIL caso repositório disponível
        if (this.notificationPreferencesRepository) {
          const emailPrefs =
            await this.notificationPreferencesRepository.findByUserAndChannel(
              notification.userId,
              'EMAIL',
            );
          if (notification.entityType) {
            const disabledMatch = emailPrefs.find(
              (p) => p.alertType === notification.entityType && !p.isEnabled,
            );
            if (disabledMatch) {
              // Não envia, registra como erro de preferência desativada
              errors.push({
                id: notification.id.toString(),
                error: 'PREFERENCE_DISABLED',
              });
              continue;
            }
          }
        }

        // Recupera e-mail do usuário
        const user = await prisma.user.findUnique({
          where: { id: notification.userId.toString() },
          select: { email: true },
        });
        if (!user) {
          errors.push({
            id: notification.id.toString(),
            error: 'USER_NOT_FOUND',
          });
          continue;
        }

        const result = await this.emailService.sendNotificationEmail(
          user.email,
          notification.title,
          notification.message,
        );

        if (!result.success) {
          errors.push({
            id: notification.id.toString(),
            error: 'EMAIL_SEND_FAILED',
          });
          continue;
        }

        notification.markSent();
        await this.notificationsRepository.save(notification);
        sent.push(notificationToDTO(notification));
      } catch (e: unknown) {
        const message =
          typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message?: unknown }).message)
            : 'UNKNOWN_ERROR';
        errors.push({
          id: notification.id.toString(),
          error: message,
        });
      }
    }

    return { processed: pending.length, sent, errors };
  }
}
