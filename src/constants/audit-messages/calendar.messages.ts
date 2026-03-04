import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

export const CALENDAR_AUDIT_MESSAGES = {
  EVENT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CALENDAR_EVENT,
    module: AuditModule.CALENDAR,
    description: '{{userName}} criou o evento {{eventTitle}}',
  } satisfies AuditMessage,

  EVENT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CALENDAR_EVENT,
    module: AuditModule.CALENDAR,
    description: '{{userName}} atualizou o evento {{eventTitle}}',
  } satisfies AuditMessage,

  EVENT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CALENDAR_EVENT,
    module: AuditModule.CALENDAR,
    description: '{{userName}} excluiu o evento {{eventTitle}}',
  } satisfies AuditMessage,

  PARTICIPANT_INVITE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.EVENT_PARTICIPANT,
    module: AuditModule.CALENDAR,
    description:
      '{{userName}} convidou participantes para o evento {{eventTitle}}',
  } satisfies AuditMessage,

  PARTICIPANT_RESPOND: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.EVENT_PARTICIPANT,
    module: AuditModule.CALENDAR,
    description:
      '{{userName}} respondeu ao convite do evento {{eventTitle}} ({{status}})',
  } satisfies AuditMessage,

  PARTICIPANT_REMOVE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.EVENT_PARTICIPANT,
    module: AuditModule.CALENDAR,
    description:
      '{{userName}} removeu {{participantName}} do evento {{eventTitle}}',
  } satisfies AuditMessage,

  REMINDERS_MANAGE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.EVENT_REMINDER,
    module: AuditModule.CALENDAR,
    description:
      '{{userName}} configurou lembretes para o evento {{eventTitle}}',
  } satisfies AuditMessage,

  EVENT_SHARE_USER: {
    action: AuditAction.CREATE,
    entity: AuditEntity.EVENT_PARTICIPANT,
    module: AuditModule.CALENDAR,
    description:
      '{{userName}} compartilhou o evento {{eventTitle}} com {{targetUserName}}',
  } satisfies AuditMessage,

  EVENT_UNSHARE_USER: {
    action: AuditAction.DELETE,
    entity: AuditEntity.EVENT_PARTICIPANT,
    module: AuditModule.CALENDAR,
    description:
      '{{userName}} removeu o compartilhamento do evento {{eventTitle}} com {{targetUserName}}',
  } satisfies AuditMessage,

  EVENT_SHARE_TEAM: {
    action: AuditAction.CREATE,
    entity: AuditEntity.EVENT_PARTICIPANT,
    module: AuditModule.CALENDAR,
    description:
      '{{userName}} compartilhou o evento {{eventTitle}} com o time {{teamName}}',
  } satisfies AuditMessage,

  CALENDAR_EXPORT: {
    action: AuditAction.EXPORT,
    entity: AuditEntity.CALENDAR,
    module: AuditModule.CALENDAR,
    description: '{{userName}} exportou seu calendário pessoal',
  } satisfies AuditMessage,

  CALENDAR_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CALENDAR,
    module: AuditModule.CALENDAR,
    description: '{{userName}} criou o calendário {{calendarName}}',
  } satisfies AuditMessage,

  CALENDAR_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CALENDAR,
    module: AuditModule.CALENDAR,
    description: '{{userName}} atualizou o calendário {{calendarName}}',
  } satisfies AuditMessage,

  CALENDAR_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CALENDAR,
    module: AuditModule.CALENDAR,
    description: '{{userName}} excluiu o calendário {{calendarName}}',
  } satisfies AuditMessage,
} as const;
