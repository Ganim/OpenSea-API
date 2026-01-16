import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo REQUESTS (Solicitações/Tickets)
 */
export const REQUESTS_AUDIT_MESSAGES = {
  // ============================================================================
  // REQUESTS - Solicitações
  // ============================================================================

  /** Solicitação criada */
  REQUEST_CREATE: {
    action: AuditAction.REQUEST_CREATE,
    entity: AuditEntity.REQUEST,
    module: AuditModule.REQUESTS,
    description:
      '{{userName}} abriu a solicitação #{{requestNumber}}: {{subject}}',
  } satisfies AuditMessage,

  /** Solicitação atribuída */
  REQUEST_ASSIGN: {
    action: AuditAction.REQUEST_ASSIGN,
    entity: AuditEntity.REQUEST,
    module: AuditModule.REQUESTS,
    description:
      '{{adminName}} atribuiu a solicitação #{{requestNumber}} para {{assigneeName}}',
  } satisfies AuditMessage,

  /** Solicitação concluída */
  REQUEST_COMPLETE: {
    action: AuditAction.REQUEST_COMPLETE,
    entity: AuditEntity.REQUEST,
    module: AuditModule.REQUESTS,
    description: '{{userName}} concluiu a solicitação #{{requestNumber}}',
  } satisfies AuditMessage,

  /** Solicitação cancelada */
  REQUEST_CANCEL: {
    action: AuditAction.REQUEST_CANCEL,
    entity: AuditEntity.REQUEST,
    module: AuditModule.REQUESTS,
    description: '{{userName}} cancelou a solicitação #{{requestNumber}}',
  } satisfies AuditMessage,

  /** Informações solicitadas */
  REQUEST_INFO_REQUEST: {
    action: AuditAction.REQUEST_INFO,
    entity: AuditEntity.REQUEST,
    module: AuditModule.REQUESTS,
    description:
      '{{userName}} solicitou informações adicionais na solicitação #{{requestNumber}}',
  } satisfies AuditMessage,

  /** Informações fornecidas */
  REQUEST_INFO_PROVIDE: {
    action: AuditAction.REQUEST_INFO_PROVIDE,
    entity: AuditEntity.REQUEST,
    module: AuditModule.REQUESTS,
    description:
      '{{userName}} forneceu informações adicionais na solicitação #{{requestNumber}}',
  } satisfies AuditMessage,

  /** Comentário adicionado */
  REQUEST_COMMENT_ADD: {
    action: AuditAction.REQUEST_COMMENT,
    entity: AuditEntity.REQUEST_COMMENT,
    module: AuditModule.REQUESTS,
    description: '{{userName}} comentou na solicitação #{{requestNumber}}',
  } satisfies AuditMessage,
} as const;

export type RequestsAuditMessageKey = keyof typeof REQUESTS_AUDIT_MESSAGES;
