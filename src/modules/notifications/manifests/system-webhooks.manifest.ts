import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

/**
 * System webhooks manifest — Phase 11 / Plan 11-01 / D-24.
 *
 * Declara 1 categoria `system.webhook.delivery_failed` ACTIONABLE/HIGH/IN_APP+EMAIL.
 *
 * URL do botão "Ver no painel" é passada por `dispatch.data.url` no
 * dispatcher consumer (`/devices/webhooks/${endpointId}`) — V1 simplification
 * A10/A11: schema atual de manifest categoria não embeds URL declarativa.
 *
 * Channels: IN_APP + EMAIL (admin-side). NÃO PUSH — webhook é admin-only,
 * não tem token VAPID por funcionário operacional.
 *
 * digestSupported=false — DEAD/auto-disable é evento individual de severidade
 * alta, NÃO deve ser agrupado em digest matinal.
 *
 * Order 95 coloca a seção entre Email (90) e Admin (100).
 */
export const systemWebhooksManifest: ModuleNotificationManifest = {
  module: 'system.webhooks',
  displayName: 'Webhooks',
  icon: 'Webhook',
  order: 95,
  categories: [
    {
      code: 'system.webhook.delivery_failed',
      name: 'Falha de entrega de webhook',
      description:
        'Entrega virou DEAD após 5 tentativas, ou webhook foi auto-desativado por 10 falhas consecutivas / HTTP 410.',
      defaultType: NotificationType.ACTIONABLE,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      digestSupported: false,
    },
  ],
};
