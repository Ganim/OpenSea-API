import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { EmailService } from '@/services/email-service';
import { beforeEach, describe, expect, it } from 'vitest';
import { SendEmailNotificationUseCase } from './send-email-notification';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';

class StubEmailService extends EmailService {
  async sendNotificationEmail(
    toEmail: string,
    _title: string,
    _message: string,
  ) {
    // Usa os parâmetros para evitar warning de não utilização
    const meta = `${_title.length}:${_message.length}`;
    return {
      success: true,
      message: 'stubbed',
      return: {
        envelope: { from: 'no-reply@system.com', to: [toEmail] },
        messageId: `<stub-${Date.now()}-${meta}@system.com>`,
        accepted: [toEmail],
        rejected: [],
        pending: [],
        response: '250 OK',
      },
    };
  }
}

describe('SendEmailNotificationUseCase', () => {
  let notificationsRepository: InMemoryNotificationsRepository;
  let preferencesRepository: InMemoryNotificationPreferencesRepository;
  let emailService: StubEmailService;
  let sut: SendEmailNotificationUseCase;

  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    preferencesRepository = new InMemoryNotificationPreferencesRepository();
    emailService = new StubEmailService();
    sut = new SendEmailNotificationUseCase(
      notificationsRepository,
      emailService,
      preferencesRepository,
    );
  });
  it('should not send when preference disabled for matching entityType', async () => {
    const userId = new UniqueEntityID();
    // Cria preferência desabilitada para alertType LOW_STOCK canal EMAIL
    await preferencesRepository.create({
      userId,
      alertType: 'LOW_STOCK',
      channel: 'EMAIL',
      isEnabled: false,
    });

    const notification = await notificationsRepository.create({
      userId,
      title: 'Estoque baixo',
      message: 'Seu produto X está com estoque baixo',
      type: 'WARNING',
      channel: 'EMAIL',
      entityType: 'LOW_STOCK',
    });

    await expect(() =>
      sut.execute({
        notificationId: notification.id.toString(),
        userEmail: 'user@example.com',
      }),
    ).rejects.toThrow();
    const updated = await notificationsRepository.findById(notification.id);
    expect(updated?.isSent).toBe(false);
  });

  it('should send email and mark notification as sent', async () => {
    const notification = await notificationsRepository.create({
      userId: new UniqueEntityID(),
      title: 'Titulo',
      message: 'Mensagem',
      type: 'INFO',
      channel: 'EMAIL',
    });

    const result = await sut.execute({
      notificationId: notification.id.toString(),
      userEmail: 'user@example.com',
    });

    expect(result.success).toBe(true);
    expect(result.notification.isSent).toBe(true);
    const updated = await notificationsRepository.findById(notification.id);
    expect(updated?.isSent).toBe(true);
    expect(updated?.sentAt).toBeInstanceOf(Date);
  });

  it('should not send if already sent', async () => {
    const notification = await notificationsRepository.create({
      userId: new UniqueEntityID(),
      title: 'Titulo',
      message: 'Mensagem',
      type: 'INFO',
      channel: 'EMAIL',
    });
    notification.markSent();
    await notificationsRepository.save(notification);

    await expect(() =>
      sut.execute({
        notificationId: notification.id.toString(),
        userEmail: 'user@example.com',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail for non-email channel', async () => {
    const notification = await notificationsRepository.create({
      userId: new UniqueEntityID(),
      title: 'Titulo',
      message: 'Mensagem',
      type: 'INFO',
      channel: 'IN_APP',
    });

    await expect(() =>
      sut.execute({
        notificationId: notification.id.toString(),
        userEmail: 'user@example.com',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail if notification not found', async () => {
    await expect(() =>
      sut.execute({
        notificationId: new UniqueEntityID().toString(),
        userEmail: 'user@example.com',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
