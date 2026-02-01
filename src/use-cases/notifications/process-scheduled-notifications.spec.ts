import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { InMemoryNotificationPreferencesRepository } from '@/repositories/sales/in-memory/in-memory-notification-preferences-repository';
import { EmailService } from '@/services/email-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessScheduledNotificationsUseCase } from './process-scheduled-notifications';

class StubEmailService extends EmailService {
  async sendNotificationEmail(
    toEmail: string,
    _title: string,
    _message: string,
  ) {
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

describe('ProcessScheduledNotificationsUseCase', () => {
  let notificationsRepository: InMemoryNotificationsRepository;
  let preferencesRepository: InMemoryNotificationPreferencesRepository;
  let emailService: StubEmailService;
  let sut: ProcessScheduledNotificationsUseCase;
  let testUserId: UniqueEntityID;

  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    preferencesRepository = new InMemoryNotificationPreferencesRepository();
    emailService = new StubEmailService();
    sut = new ProcessScheduledNotificationsUseCase(
      notificationsRepository,
      emailService,
      preferencesRepository,
    );

    testUserId = new UniqueEntityID();

    // Mock prisma.user.findUnique to return test user with email
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: testUserId.toString(),
      email: 'test@example.com',
      username: 'testuser',
      password_hash: 'hash',
      isSuperAdmin: false,
      lastLoginIp: null,
      failedLoginAttempts: 0,
      blockedUntil: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      forcePasswordReset: false,
      forcePasswordResetReason: null,
      forcePasswordResetRequestedBy: null,
      forcePasswordResetRequestedAt: null,
      deletedAt: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  it('should skip email send when preference disabled', async () => {
    const now = new Date();

    await preferencesRepository.create({
      userId: testUserId,
      alertType: 'LOW_STOCK',
      channel: 'EMAIL',
      isEnabled: false,
    });

    const notification = await notificationsRepository.create({
      userId: testUserId,
      title: 'Estoque baixo',
      message: 'Seu produto X está com estoque baixo',
      type: 'WARNING',
      channel: 'EMAIL',
      entityType: 'LOW_STOCK',
      scheduledFor: new Date(now.getTime() - 1000),
    });

    const result = await sut.execute({ now });
    expect(result.processed).toBe(1);
    expect(result.sent).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toBe('PREFERENCE_DISABLED');
    const updated = await notificationsRepository.findById(notification.id);
    expect(updated?.isSent).toBe(false);
  });

  it('should process scheduled email notifications', async () => {
    const now = new Date();

    await notificationsRepository.create({
      userId: testUserId,
      title: 'Email 1',
      message: 'Mensagem 1',
      type: 'INFO',
      channel: 'EMAIL',
      scheduledFor: new Date(now.getTime() - 1000),
    });
    await notificationsRepository.create({
      userId: testUserId,
      title: 'Email 2',
      message: 'Mensagem 2',
      type: 'INFO',
      channel: 'EMAIL',
      scheduledFor: new Date(now.getTime() - 500),
    });

    const result = await sut.execute({ now });
    expect(result.processed).toBe(2);
    expect(result.sent).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    for (const n of result.sent) {
      const found = await notificationsRepository.findById(
        new UniqueEntityID(n.id),
      );
      expect(found?.isSent).toBe(true);
    }
  });

  it('should skip future scheduled notifications', async () => {
    const now = new Date();

    await notificationsRepository.create({
      userId: testUserId,
      title: 'Futuro',
      message: 'Mensagem',
      type: 'INFO',
      channel: 'EMAIL',
      scheduledFor: new Date(now.getTime() + 60_000),
    });

    const result = await sut.execute({ now });
    expect(result.processed).toBe(0);
    expect(result.sent).toHaveLength(0);
  });

  it('should mark non-email notification as sent without sending', async () => {
    const now = new Date();

    const notification = await notificationsRepository.create({
      userId: testUserId,
      title: 'InApp',
      message: 'Mensagem',
      type: 'INFO',
      channel: 'IN_APP',
      scheduledFor: new Date(now.getTime() - 1000),
    });

    const result = await sut.execute({ now });
    expect(result.processed).toBe(1);
    expect(result.sent).toHaveLength(1);
    const updated = await notificationsRepository.findById(notification.id);
    expect(updated?.isSent).toBe(true);
  });
});
