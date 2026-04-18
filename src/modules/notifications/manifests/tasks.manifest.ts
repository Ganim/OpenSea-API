import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

const L = NotificationType.LINK;
const I = NotificationType.INFORMATIONAL;
const IA = NotificationChannel.IN_APP;
const EM = NotificationChannel.EMAIL;

export const tasksManifest: ModuleNotificationManifest = {
  module: 'tasks',
  displayName: 'Tarefas',
  icon: 'CheckSquare',
  order: 85,
  categories: [
    {
      code: 'tasks.assigned',
      name: 'Tarefa atribuída',
      description: 'Nova tarefa para você.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'tasks.mentioned',
      name: 'Menção em tarefa',
      description: 'Alguém te mencionou num comentário.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'tasks.due_soon',
      name: 'Tarefa a vencer',
      description: 'Prazo próximo.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA],
    },
    {
      code: 'tasks.due_today',
      name: 'Tarefa vence hoje',
      description: 'Prazo é hoje.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'tasks.overdue',
      name: 'Tarefa em atraso',
      description: 'Tarefa ultrapassou o prazo.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },
    {
      code: 'tasks.completed_shared',
      name: 'Tarefa concluída',
      description: 'Alguém concluiu tarefa em board compartilhado.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
      digestSupported: true,
    },
    {
      code: 'tasks.board_shared',
      name: 'Board compartilhado',
      description: 'Você foi adicionado a um board.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'tasks.board_digest',
      name: 'Resumo do board',
      description: 'Atividades recentes no board.',
      defaultType: L,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [EM],
      digestSupported: true,
    },
  ],
};
