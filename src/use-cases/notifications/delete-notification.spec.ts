import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateNotificationUseCase } from './create-notification';
import { DeleteNotificationUseCase } from './delete-notification';

let notificationsRepository: InMemoryNotificationsRepository;
let createNotification: CreateNotificationUseCase;
let deleteNotification: DeleteNotificationUseCase;

describe('DeleteNotificationUseCase', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    createNotification = new CreateNotificationUseCase(notificationsRepository);
    deleteNotification = new DeleteNotificationUseCase(notificationsRepository);
  });

  it('deve fazer soft delete e ocultar da listagem', async () => {
    const { notification } = await createNotification.execute({
      userId: 'user-1',
      title: 'Teste',
      message: 'Msg',
      type: 'INFO',
      channel: 'IN_APP',
    });

    await deleteNotification.execute({
      notificationId: notification.id.toString(),
      userId: 'user-1',
    });
    expect(notification.deletedAt).toBeInstanceOf(Date);

    const { total } = await notificationsRepository.list({
      userId: notification.userId,
    });
    expect(total).toBe(0);
  });

  it('deve falhar ao deletar notificação de outro usuário', async () => {
    const { notification } = await createNotification.execute({
      userId: 'user-1',
      title: 'Teste',
      message: 'Msg',
      type: 'INFO',
      channel: 'IN_APP',
    });

    await expect(
      deleteNotification.execute({
        notificationId: notification.id.toString(),
        userId: 'user-2',
      }),
    ).rejects.toThrow('Notification not found');

    expect(notification.deletedAt).toBeUndefined();
  });

  it('deve falhar ao deletar notificação inexistente', async () => {
    await expect(
      deleteNotification.execute({
        notificationId: '00000000-0000-0000-0000-000000000000',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Notification not found');
  });
});
