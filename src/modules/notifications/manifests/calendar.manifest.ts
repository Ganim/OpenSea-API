import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

const A = NotificationType.ACTIONABLE;
const L = NotificationType.LINK;
const I = NotificationType.INFORMATIONAL;
const IA = NotificationChannel.IN_APP;
const EM = NotificationChannel.EMAIL;
const PU = NotificationChannel.PUSH;

export const calendarManifest: ModuleNotificationManifest = {
  module: 'calendar',
  displayName: 'Agenda',
  icon: 'Calendar',
  order: 80,
  categories: [
    {
      code: 'calendar.event_invited',
      name: 'Convite de evento',
      description: 'Você foi convidado para um evento.',
      defaultType: A,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'calendar.event_accepted',
      name: 'Convite aceito',
      description: 'Participante aceitou o convite.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },
    {
      code: 'calendar.event_declined',
      name: 'Convite recusado',
      description: 'Participante recusou o convite.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'calendar.event_reminder_1h',
      name: 'Lembrete 1 hora',
      description: 'Evento começa em 1 hora.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'calendar.event_reminder_15min',
      name: 'Lembrete 15 minutos',
      description: 'Evento começa em 15 minutos.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, PU],
    },
    {
      code: 'calendar.event_reminder_5min',
      name: 'Lembrete 5 minutos',
      description: 'Evento começa em 5 minutos.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, PU],
    },
    {
      code: 'calendar.event_cancelled',
      name: 'Evento cancelado',
      description: 'Evento foi cancelado.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'calendar.event_rescheduled',
      name: 'Evento remarcado',
      description: 'Data/hora do evento foi alterada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'calendar.event_agenda_updated',
      name: 'Agenda atualizada',
      description: 'Detalhes do evento foram editados.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'calendar.event_shared',
      name: 'Evento compartilhado',
      description: 'Um evento foi compartilhado com sua equipe.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
  ],
};
