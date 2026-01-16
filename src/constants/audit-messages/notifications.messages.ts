import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo NOTIFICATIONS
 */
export const NOTIFICATIONS_AUDIT_MESSAGES = {
  // ============================================================================
  // NOTIFICATIONS - Notificações
  // ============================================================================

  /** Email de notificação enviado */
  NOTIFICATION_SEND_EMAIL: {
    action: AuditAction.NOTIFICATION_SEND,
    entity: AuditEntity.NOTIFICATION,
    module: AuditModule.NOTIFICATIONS,
    description: 'Sistema enviou notificação por email para {{recipientEmail}}',
  } satisfies AuditMessage,

  /** Notificação marcada como lida */
  NOTIFICATION_MARK_READ: {
    action: AuditAction.NOTIFICATION_READ,
    entity: AuditEntity.NOTIFICATION,
    module: AuditModule.NOTIFICATIONS,
    description: '{{userName}} marcou notificação como lida',
  } satisfies AuditMessage,

  /** Todas notificações marcadas como lidas */
  NOTIFICATION_MARK_ALL_READ: {
    action: AuditAction.NOTIFICATION_READ,
    entity: AuditEntity.NOTIFICATION,
    module: AuditModule.NOTIFICATIONS,
    description: '{{userName}} marcou todas as notificações como lidas',
  } satisfies AuditMessage,

  /** Notificação excluída */
  NOTIFICATION_DELETE: {
    action: AuditAction.NOTIFICATION_DELETE,
    entity: AuditEntity.NOTIFICATION,
    module: AuditModule.NOTIFICATIONS,
    description: '{{userName}} excluiu uma notificação',
  } satisfies AuditMessage,

  /** Notificações agendadas processadas */
  NOTIFICATION_PROCESS_SCHEDULED: {
    action: AuditAction.NOTIFICATION_SEND,
    entity: AuditEntity.NOTIFICATION,
    module: AuditModule.NOTIFICATIONS,
    description: 'Sistema processou {{count}} notificações agendadas',
  } satisfies AuditMessage,
} as const;

export type NotificationsAuditMessageKey =
  keyof typeof NOTIFICATIONS_AUDIT_MESSAGES;
