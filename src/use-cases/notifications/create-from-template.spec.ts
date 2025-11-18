import { InMemoryNotificationTemplatesRepository } from '@/repositories/notifications/in-memory/in-memory-notification-templates-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateFromTemplateUseCase } from './create-from-template';

let notificationsRepository: InMemoryNotificationsRepository;
let templatesRepository: InMemoryNotificationTemplatesRepository;
let createFromTemplate: CreateFromTemplateUseCase;

describe('CreateFromTemplateUseCase', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository();
    templatesRepository = new InMemoryNotificationTemplatesRepository();
    createFromTemplate = new CreateFromTemplateUseCase(
      notificationsRepository,
      templatesRepository,
    );
  });

  it('deve criar notificação a partir de template com interpolação', async () => {
    await templatesRepository.create({
      code: 'WELCOME',
      name: 'Boas-vindas',
      titleTemplate: 'Olá {{name}}',
      messageTemplate: 'Sua conta ({{email}}) foi criada',
      defaultChannel: 'IN_APP',
      defaultPriority: 'NORMAL',
    });

    const { notification } = await createFromTemplate.execute({
      templateCode: 'WELCOME',
      userId: 'user-1',
      variables: { name: 'João', email: 'joao@example.com' },
    });

    expect(notification.title).toBe('Olá João');
    expect(notification.message).toBe('Sua conta (joao@example.com) foi criada');
    expect(notification.channel).toBe('IN_APP');
    expect(notification.priority).toBe('NORMAL');
  });

  it('deve permitir sobrepor canal e prioridade do template', async () => {
    await templatesRepository.create({
      code: 'ALERT',
      name: 'Alerta',
      titleTemplate: 'Atenção',
      messageTemplate: 'Limite excedido',
      defaultChannel: 'IN_APP',
      defaultPriority: 'NORMAL',
    });

    const { notification } = await createFromTemplate.execute({
      templateCode: 'ALERT',
      userId: 'user-1',
      channel: 'EMAIL',
      priority: 'HIGH',
    });

    expect(notification.channel).toBe('EMAIL');
    expect(notification.priority).toBe('HIGH');
  });

  it('deve falhar se template não existir ou estiver inativo', async () => {
    await expect(
      createFromTemplate.execute({ templateCode: 'MISSING', userId: 'u1' }),
    ).rejects.toThrowError();
  });
});
