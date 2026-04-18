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

export const emailManifest: ModuleNotificationManifest = {
  module: 'email',
  displayName: 'E-mail',
  icon: 'Mail',
  order: 90,
  categories: [
    {
      code: 'email.new_message_starred',
      name: 'Mensagem em conversa favorita',
      description: 'Chegou e-mail em thread marcada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
      digestSupported: true,
    },
    {
      code: 'email.mention',
      name: 'Menção em e-mail',
      description: 'Você foi mencionado num e-mail.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA],
    },
    {
      code: 'email.bounce',
      name: 'E-mail bounced',
      description: 'Envio retornou como falha permanente.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'email.imap_sync_failed',
      name: 'Falha na sincronização IMAP',
      description: 'Conta não sincronizou.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'email.mailbox_quota_warning',
      name: 'Quota da caixa postal',
      description: 'Mailbox próximo do limite.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'email.shared_mailbox_invitation',
      name: 'Convite para caixa compartilhada',
      description: 'Você foi adicionado a uma caixa.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'email.rule_triggered',
      name: 'Regra de e-mail disparou',
      description: 'Regra automática aplicou ação.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
      digestSupported: true,
    },
  ],
};
