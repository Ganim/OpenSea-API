import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateNotificationUseCase } from './create-notification';

let notificationsRepository: InMemoryNotificationsRepository;
let createNotification: CreateNotificationUseCase;

describe('CreateNotificationUseCase', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    createNotification = new CreateNotificationUseCase(notificationsRepository);
  });

  it('deve criar uma notificação IN_APP com prioridade NORMAL por padrão', async () => {
    const result = await createNotification.execute({
      userId: 'user-1',
      title: 'Bem-vindo',
      message: 'Sua conta foi criada com sucesso.',
      type: 'INFO',
      channel: 'IN_APP',
    });

    expect(result.notification).toBeDefined();
    expect(result.notification.title).toBe('Bem-vindo');
    expect(result.notification.channel).toBe('IN_APP');
    expect(result.notification.priority).toBe('NORMAL');
    expect(result.notification.isRead).toBe(false);
    expect(result.notification.isSent).toBe(false);
  });

  it('deve aceitar actionUrl e actionText opcionais', async () => {
    const result = await createNotification.execute({
      userId: 'user-1',
      title: 'Ação necessária',
      message: 'Clique para verificar seus dados.',
      type: 'WARNING',
      channel: 'IN_APP',
      actionUrl: 'https://example.com/verify',
      actionText: 'Verificar',
    });

    expect(result.notification.actionUrl).toBe('https://example.com/verify');
    expect(result.notification.actionText).toBe('Verificar');
  });
});
