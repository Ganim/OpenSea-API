import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateNotificationUseCase } from './create-notification';
import { ListNotificationsByUserIdUseCase } from './list-notifications';

let notificationsRepository: InMemoryNotificationsRepository;
let listNotifications: ListNotificationsByUserIdUseCase;
let createNotification: CreateNotificationUseCase;

describe('ListNotificationsByUserIdUseCase', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    listNotifications = new ListNotificationsByUserIdUseCase(notificationsRepository);
    createNotification = new CreateNotificationUseCase(notificationsRepository);
  });

  it('deve listar com filtros e paginação', async () => {
    // cria 30 notificações para user-1
    for (let i = 1; i <= 30; i++) {
      await createNotification.execute({
        userId: 'user-1',
        title: `N${i}`,
        message: 'msg',
        type: i % 2 === 0 ? 'INFO' : 'WARNING',
        channel: i % 3 === 0 ? 'EMAIL' : 'IN_APP',
        priority: i % 5 === 0 ? 'HIGH' : 'NORMAL',
      });
    }

    // marca algumas como lidas
    notificationsRepository.items.slice(0, 5).forEach((n) => n.markRead());

    const page1 = await listNotifications.execute({ userId: 'user-1', page: 1, limit: 10 });
    const page2 = await listNotifications.execute({ userId: 'user-1', page: 2, limit: 10 });

    expect(page1.total).toBe(30);
    expect(page1.data).toHaveLength(10);
    expect(page2.data).toHaveLength(10);

    const onlyUnread = await listNotifications.execute({ userId: 'user-1', isRead: false });
    expect(onlyUnread.total).toBe(25);

    const onlyEmail = await listNotifications.execute({ userId: 'user-1', channel: 'EMAIL' });
    expect(onlyEmail.total).toBeGreaterThan(0);

    const onlyHigh = await listNotifications.execute({ userId: 'user-1', priority: 'HIGH' });
    expect(onlyHigh.total).toBe(6);
  });

  it('deve respeitar intervalo de datas', async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    // 1 no passado, 1 ontem, 1 agora
    const n1 = await createNotification.execute({
      userId: 'user-2', title: 'A', message: 'A', type: 'INFO', channel: 'IN_APP'
    });
    const n2 = await createNotification.execute({
      userId: 'user-2', title: 'B', message: 'B', type: 'INFO', channel: 'IN_APP'
    });
    const n3 = await createNotification.execute({
      userId: 'user-2', title: 'C', message: 'C', type: 'INFO', channel: 'IN_APP'
    });

    // Ajusta datas
    n1.notification['props'].createdAt = past;
    n2.notification['props'].createdAt = yesterday;

    const resPastToYesterday = await listNotifications.execute({ userId: 'user-2', startDate: past, endDate: yesterday });
    expect(resPastToYesterday.total).toBe(2);

    const resTodayOnly = await listNotifications.execute({ userId: 'user-2', startDate: now });
    expect(resTodayOnly.total).toBe(1);
  });
});
