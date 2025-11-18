import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateNotificationUseCase } from './create-notification';
import { MarkAllAsReadUseCase } from './mark-all-as-read';

let notificationsRepository: InMemoryNotificationsRepository;
let createNotification: CreateNotificationUseCase;
let markAllAsRead: MarkAllAsReadUseCase;

describe('MarkAllAsReadUseCase', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    createNotification = new CreateNotificationUseCase(notificationsRepository);
    markAllAsRead = new MarkAllAsReadUseCase(notificationsRepository);
  });

  it('deve marcar todas as notificações do usuário como lidas e retornar contagem', async () => {
    for (let i = 0; i < 5; i++) {
      await createNotification.execute({
        userId: 'user-1',
        title: `N${i}`,
        message: 'msg',
        type: 'INFO',
        channel: 'IN_APP',
      });
    }
    // já lida 1
    notificationsRepository.items[0].markRead();

    const { count } = await markAllAsRead.execute({ userId: 'user-1' });
    expect(count).toBe(4);
    expect(notificationsRepository.items.every((n) => n.isRead)).toBe(true);
  });
});
