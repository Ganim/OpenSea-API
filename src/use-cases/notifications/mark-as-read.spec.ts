import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateNotificationUseCase } from './create-notification';
import { MarkAsReadUseCase } from './mark-as-read';

let notificationsRepository: InMemoryNotificationsRepository;
let createNotification: CreateNotificationUseCase;
let markAsRead: MarkAsReadUseCase;

describe('MarkAsReadUseCase', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    createNotification = new CreateNotificationUseCase(notificationsRepository);
    markAsRead = new MarkAsReadUseCase(notificationsRepository);
  });

  it('deve marcar uma notificação como lida', async () => {
    const { notification } = await createNotification.execute({
      userId: 'user-1',
      title: 'Teste',
      message: 'Mensagem',
      type: 'INFO',
      channel: 'IN_APP',
    });

    expect(notification.isRead).toBe(false);
    await markAsRead.execute({
      notificationId: notification.id.toString(),
      userId: 'user-1',
    });
    expect(notification.isRead).toBe(true);
    expect(notification.readAt).toBeInstanceOf(Date);
  });

  it('deve falhar ao marcar notificação de outro usuário', async () => {
    const { notification } = await createNotification.execute({
      userId: 'user-1',
      title: 'Teste',
      message: 'Mensagem',
      type: 'INFO',
      channel: 'IN_APP',
    });

    await expect(
      markAsRead.execute({
        notificationId: notification.id.toString(),
        userId: 'user-2',
      }),
    ).rejects.toThrow('Notification not found');

    expect(notification.isRead).toBe(false);
  });

  it('deve falhar ao marcar notificação inexistente', async () => {
    await expect(
      markAsRead.execute({
        notificationId: '00000000-0000-0000-0000-000000000000',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Notification not found');
  });
});
