import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

const L = NotificationType.LINK;
const I = NotificationType.INFORMATIONAL;
const A = NotificationType.ACTIONABLE;
const SB = NotificationType.SYSTEM_BANNER;
const IA = NotificationChannel.IN_APP;
const EM = NotificationChannel.EMAIL;

/**
 * Core security / auth / system events. Applies to every user regardless
 * of modules contracted by the tenant.
 */
export const coreManifest: ModuleNotificationManifest = {
  module: 'core',
  displayName: 'Sistema',
  icon: 'Bell',
  order: 10,
  categories: [
    // Security
    {
      code: 'core.security_alert',
      name: 'Alerta de segurança',
      description: 'Atividade suspeita detectada.',
      defaultType: I,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
      mandatory: true,
      digestSupported: false,
    },
    {
      code: 'core.login_new_device',
      name: 'Login em dispositivo novo',
      description: 'Acesso em dispositivo não reconhecido.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
      mandatory: true,
    },
    {
      code: 'core.password_changed',
      name: 'Senha alterada',
      description: 'Sua senha foi mudada.',
      defaultType: I,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
      mandatory: true,
    },
    {
      code: 'core.password_expiring',
      name: 'Senha expirando',
      description: 'Troque sua senha antes do vencimento.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'core.twofa_enabled',
      name: '2FA ativado',
      description: 'Autenticação em dois fatores ligada.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'core.twofa_disabled',
      name: '2FA desativado',
      description: 'Autenticação em dois fatores desligada.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
      mandatory: true,
    },
    {
      code: 'core.account_locked',
      name: 'Conta bloqueada',
      description: 'Muitas tentativas falhas de login.',
      defaultType: L,
      defaultPriority: NotificationPriority.URGENT,
      defaultChannels: [IA, EM],
      mandatory: true,
    },
    {
      code: 'core.session_revoked',
      name: 'Sessão revogada',
      description: 'Sessão foi encerrada por um admin.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // API / tokens
    {
      code: 'core.api_key_created',
      name: 'API key criada',
      description: 'Nova chave de API gerada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'core.api_key_revoked',
      name: 'API key revogada',
      description: 'Chave de API desativada.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'core.api_key_expiring',
      name: 'API key expirando',
      description: 'Chave próxima do vencimento.',
      defaultType: L,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },

    // Permissions / roles
    {
      code: 'core.role_changed',
      name: 'Papel alterado',
      description: 'Seus papéis foram modificados.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'core.permission_granted',
      name: 'Permissão concedida',
      description: 'Você recebeu nova permissão.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },

    // Tenant invitations
    {
      code: 'core.tenant_invitation',
      name: 'Convite de tenant',
      description: 'Você foi convidado para uma empresa.',
      defaultType: A,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'core.tenant_invitation_accepted',
      name: 'Convite aceito',
      description: 'Usuário aceitou o convite.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'core.tenant_invitation_declined',
      name: 'Convite recusado',
      description: 'Usuário recusou o convite.',
      defaultType: I,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },

    // Data
    {
      code: 'core.data_export_ready',
      name: 'Exportação pronta',
      description: 'Download de dados disponível.',
      defaultType: L,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },

    // System
    {
      code: 'core.system_announcement',
      name: 'Aviso do sistema',
      description: 'Comunicado oficial da plataforma.',
      defaultType: SB,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'core.maintenance_scheduled',
      name: 'Manutenção programada',
      description: 'Haverá manutenção em breve.',
      defaultType: SB,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'core.deployment_notice',
      name: 'Nova versão implantada',
      description: 'Sistema foi atualizado.',
      defaultType: I,
      defaultPriority: NotificationPriority.LOW,
      defaultChannels: [IA],
    },
  ],
};
