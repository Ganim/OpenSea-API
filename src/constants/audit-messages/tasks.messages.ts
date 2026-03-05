import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

export const TASKS_AUDIT_MESSAGES = {
  BOARD_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TASK_BOARD,
    module: AuditModule.TASKS,
    description: '{{userName}} criou o quadro {{boardTitle}}',
  } satisfies AuditMessage,

  BOARD_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TASK_BOARD,
    module: AuditModule.TASKS,
    description: '{{userName}} atualizou o quadro {{boardTitle}}',
  } satisfies AuditMessage,

  BOARD_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TASK_BOARD,
    module: AuditModule.TASKS,
    description: '{{userName}} excluiu o quadro {{boardTitle}}',
  } satisfies AuditMessage,

  BOARD_ARCHIVE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TASK_BOARD,
    module: AuditModule.TASKS,
    description: '{{userName}} arquivou o quadro {{boardTitle}}',
  } satisfies AuditMessage,

  MEMBER_INVITE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BOARD_MEMBER,
    module: AuditModule.TASKS,
    description: '{{userName}} convidou um membro para o quadro {{boardTitle}}',
  } satisfies AuditMessage,

  MEMBER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BOARD_MEMBER,
    module: AuditModule.TASKS,
    description:
      '{{userName}} atualizou permissões de membro no quadro {{boardTitle}}',
  } satisfies AuditMessage,

  MEMBER_REMOVE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.BOARD_MEMBER,
    module: AuditModule.TASKS,
    description: '{{userName}} removeu um membro do quadro {{boardTitle}}',
  } satisfies AuditMessage,

  CARD_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TASK_CARD,
    module: AuditModule.TASKS,
    description: '{{userName}} criou o cartão {{cardTitle}}',
  } satisfies AuditMessage,

  CARD_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TASK_CARD,
    module: AuditModule.TASKS,
    description: '{{userName}} atualizou o cartão {{cardTitle}}',
  } satisfies AuditMessage,

  CARD_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TASK_CARD,
    module: AuditModule.TASKS,
    description: '{{userName}} excluiu o cartão {{cardTitle}}',
  } satisfies AuditMessage,

  CARD_MOVE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TASK_CARD,
    module: AuditModule.TASKS,
    description: '{{userName}} moveu o cartão {{cardTitle}}',
  } satisfies AuditMessage,

  CARD_ASSIGN: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TASK_CARD,
    module: AuditModule.TASKS,
    description: '{{userName}} atribuiu o cartão {{cardTitle}}',
  } satisfies AuditMessage,

  CARD_ARCHIVE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TASK_CARD,
    module: AuditModule.TASKS,
    description: '{{userName}} arquivou o cartão {{cardTitle}}',
  } satisfies AuditMessage,

  AUTOMATION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BOARD_AUTOMATION,
    module: AuditModule.TASKS,
    description: '{{userName}} criou a automação {{automationName}}',
  } satisfies AuditMessage,

  AUTOMATION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BOARD_AUTOMATION,
    module: AuditModule.TASKS,
    description: '{{userName}} atualizou a automação {{automationName}}',
  } satisfies AuditMessage,

  AUTOMATION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.BOARD_AUTOMATION,
    module: AuditModule.TASKS,
    description: '{{userName}} excluiu a automação {{automationName}}',
  } satisfies AuditMessage,
} as const;
