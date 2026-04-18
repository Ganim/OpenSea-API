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

/**
 * Super-admin only events, visible in the Central area.
 */
export const adminManifest: ModuleNotificationManifest = {
  module: 'admin',
  displayName: 'Administração',
  icon: 'ShieldCheck',
  order: 95,
  categories: [
    {
      code: 'admin.tenant_created',
      name: 'Novo tenant criado',
      description: 'Uma empresa foi criada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'admin.tenant_suspended',
      name: 'Tenant suspenso',
      description: 'Empresa foi suspensa.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'admin.tenant_reactivated',
      name: 'Tenant reativado',
      description: 'Empresa foi reativada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'admin.plan_upgraded',
      name: 'Upgrade de plano',
      description: 'Empresa atualizou plano.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'admin.plan_downgraded',
      name: 'Downgrade de plano',
      description: 'Empresa rebaixou plano.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'admin.payment_failed',
      name: 'Pagamento da plataforma falhou',
      description: 'Mensalidade não foi paga.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
      mandatory: true,
    },
    {
      code: 'admin.payment_succeeded',
      name: 'Pagamento da plataforma',
      description: 'Mensalidade paga.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },
    {
      code: 'admin.trial_expiring',
      name: 'Trial expirando',
      description: 'Empresa em teste com prazo próximo do fim.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'admin.module_toggled',
      name: 'Módulo habilitado/desabilitado',
      description: 'Alteração nos módulos contratados.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'admin.feature_flag_changed',
      name: 'Feature flag alterada',
      description: 'Flag de feature foi mudada.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },
    {
      code: 'admin.rate_limit_hit',
      name: 'Rate limit excedido',
      description: 'Limite sistêmico atingido.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'admin.error_rate_alert',
      name: 'Taxa de erro alta',
      description: 'Erros acima do normal.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
    },
  ],
};
