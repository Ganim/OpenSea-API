import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';
import {
  notificationToDTO,
  type NotificationDTO,
} from '@/mappers/notifications/notification-to-dto';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import { EmailService } from '@/services/email-service';

interface SendEmailNotificationRequest {
  notificationId: string;
  userEmail?: string; // Permite teste sem buscar usuário no banco
}

interface SendEmailNotificationResponse {
  success: boolean;
  notification: NotificationDTO;
}

export class SendEmailNotificationUseCase {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private emailService: EmailService,
    private notificationPreferencesRepository?: NotificationPreferencesRepository,
  ) {}

  async execute(
    request: SendEmailNotificationRequest,
  ): Promise<SendEmailNotificationResponse> {
    const notificationId = new UniqueEntityID(request.notificationId);

    const notification =
      await this.notificationsRepository.findById(notificationId);
    if (!notification || notification.isDeleted) {
      throw new ResourceNotFoundError('Notification not found');
    }

    if (notification.isSent) {
      throw new BadRequestError('Notification already sent');
    }

    if (notification.channel !== 'EMAIL') {
      throw new BadRequestError('Notification channel is not EMAIL');
    }

    // Preferências: se existir preferência desabilitada para este usuário e canal EMAIL, bloquear envio.
    if (this.notificationPreferencesRepository) {
      const emailPrefs = await this.notificationPreferencesRepository.findByUserAndChannel(
        notification.userId,
        'EMAIL',
      );
      // Estratégia: se houver ao menos uma preferência explicitamente desabilitada para qualquer alertType
      // e a notificação estiver vinculada a uma entityType que corresponda ao alertType, bloquear.
      // Mapeamento simples: se entityType coincide exatamente com alertType string.
      if (notification.entityType) {
        const matchedPref = emailPrefs.find(
          (p) => p.alertType === notification.entityType && !p.isEnabled,
        );
        if (matchedPref) {
          throw new BadRequestError('Email notification disabled by preferences');
        }
      }
    }

    // E-mail alvo (override para testes ou fallback ao usuário real)
    let targetEmail = request.userEmail;
    if (!targetEmail) {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId.toString() },
      });
      if (!user) {
        throw new ResourceNotFoundError('User not found');
      }
      targetEmail = user.email;
    }

    const result = await this.emailService.sendNotificationEmail(
      targetEmail,
      notification.title,
      notification.message,
    );

    if (result.success) {
      notification.markSent();
      await this.notificationsRepository.save(notification);
    } else {
      throw new BadRequestError('Failed to send notification e-mail');
    }

    return { success: true, notification: notificationToDTO(notification) };
  }
}
