import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

/**
 * Punch module notification manifest.
 *
 * Declares the categories exposed by the punch module to the notifications
 * v2 module. The bootstrap sync (see `bootstrap.ts`) upserts these
 * categories into the `notificationCategory` table and surfaces the `punch`
 * module in `/v1/notifications/modules-manifest` so users can manage their
 * punch-related preferences in the UI.
 *
 * Phase 4 declared 3 categories (registered, late, approval_requested).
 * Phase 5 (Plan 05-02) adds 2 more for kiosk PIN lockout and bulk QR
 * rotation completion — bringing the total to 5.
 *
 * Order value 35 places the section between HR (30) and Finance (40).
 */
export const punchManifest: ModuleNotificationManifest = {
  module: 'punch',
  displayName: 'Ponto',
  icon: 'Clock',
  order: 35,
  categories: [
    {
      code: 'punch.registered',
      name: 'Batida registrada',
      description: 'Confirmação enviada ao funcionário após cada batida.',
      defaultType: NotificationType.INFORMATIONAL,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      digestSupported: true,
    },
    {
      code: 'punch.late',
      name: 'Atraso na batida',
      description:
        'Alerta quando o funcionário não bate ponto no horário esperado.',
      defaultType: NotificationType.ACTIONABLE,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      digestSupported: true,
    },
    {
      code: 'punch.approval_requested',
      name: 'Aprovação de batida pendente',
      description:
        'Gestor precisa aprovar batida fora da área permitida ou com exceção.',
      defaultType: NotificationType.APPROVAL,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      digestSupported: false,
    },
    // Phase 5 — kiosk + QR + face match (D-11, D-14)
    {
      code: 'punch.pin_locked',
      name: 'PIN de ponto bloqueado',
      description:
        'Funcionário bloqueado no kiosk após 5 tentativas erradas de PIN.',
      defaultType: NotificationType.ACTIONABLE,
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      digestSupported: false,
    },
    {
      code: 'punch.qr_rotation.completed',
      name: 'Rotação de QR concluída',
      description:
        'Lote de rotação de QR de crachás finalizado pelo administrador.',
      defaultType: NotificationType.INFORMATIONAL,
      defaultPriority: NotificationPriority.NORMAL,
      defaultChannels: [NotificationChannel.IN_APP],
      digestSupported: true,
    },
  ],
};
