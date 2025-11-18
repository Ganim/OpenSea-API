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

    await deleteNotification.execute({ notificationId: notification.id.toString() });
    expect(notification.deletedAt).toBeInstanceOf(Date);

    const { total } = await notificationsRepository.list({ userId: notification.userId });
    expect(total).toBe(0);
  });
});
