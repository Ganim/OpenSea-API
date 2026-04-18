import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

const I = NotificationType.INFORMATIONAL;
const L = NotificationType.LINK;
const A = NotificationType.ACTIONABLE;
const AP = NotificationType.APPROVAL;
const IA = NotificationChannel.IN_APP;
const EM = NotificationChannel.EMAIL;
const PU = NotificationChannel.PUSH;

export const requestsManifest: ModuleNotificationManifest = {
  module: 'requests',
  displayName: 'Solicitações',
  icon: 'ClipboardList',
  order: 70,
  categories: [
    {
      code: 'requests.created',
      name: 'Solicitação criada',
      description: 'Nova solicitação aberta.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'requests.assigned',
      name: 'Solicitação atribuída',
      description: 'Uma solicitação foi atribuída a você.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'requests.reassigned',
      name: 'Solicitação reatribuída',
      description: 'Mudança de responsável.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'requests.unassigned',
      name: 'Solicitação desatribuída',
      description: 'Você deixou de ser responsável.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'requests.commented',
      name: 'Novo comentário',
      description: 'Comentário em solicitação que você segue.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
      digestSupported: true,
    },
    {
      code: 'requests.info_requested',
      name: 'Informações solicitadas',
      description: 'Alguém pediu mais detalhes.',
      defaultType: A,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'requests.info_provided',
      name: 'Informações fornecidas',
      description: 'Requisitor respondeu ao pedido de informação.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'requests.in_progress',
      name: 'Em andamento',
      description: 'Solicitação começou a ser atendida.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'requests.completed',
      name: 'Concluída',
      description: 'Solicitação foi concluída.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'requests.cancelled',
      name: 'Cancelada',
      description: 'Solicitação foi cancelada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'requests.sla_warning',
      name: 'SLA a vencer',
      description: 'Prazo de atendimento próximo.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM, PU],
    },
    {
      code: 'requests.sla_breached',
      name: 'SLA violado',
      description: 'Prazo de atendimento ultrapassado.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM, PU],
    },
    {
      code: 'requests.approval_pending',
      name: 'Aprovação pendente',
      description: 'Solicitação aguarda sua aprovação.',
      defaultType: AP,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'requests.approval_approved',
      name: 'Aprovação concedida',
      description: 'Aprovação foi concedida.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'requests.approval_rejected',
      name: 'Aprovação rejeitada',
      description: 'Aprovação foi negada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
  ],
};
