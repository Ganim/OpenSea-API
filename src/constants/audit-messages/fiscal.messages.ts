import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo FISCAL
 *
 * Inclui: Config, Certificates, Documents (NF-e, NFC-e),
 * Cancellation, Correction Letter
 */
export const FISCAL_AUDIT_MESSAGES = {
  // ============================================================================
  // CONFIG - Configuração fiscal
  // ============================================================================

  /** Configuração fiscal criada ou atualizada */
  CONFIG_UPSERT: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.OTHER,
    module: AuditModule.SYSTEM,
    description:
      '{{userName}} atualizou a configuração fiscal (provider: {{provider}}, ambiente: {{environment}})',
  } satisfies AuditMessage,

  // ============================================================================
  // CERTIFICATES - Certificados digitais
  // ============================================================================

  /** Certificado digital enviado */
  CERTIFICATE_UPLOAD: {
    action: AuditAction.CREATE,
    entity: AuditEntity.OTHER,
    module: AuditModule.SYSTEM,
    description:
      '{{userName}} enviou o certificado digital (serial: {{serialNumber}}, validade: {{validUntil}})',
  } satisfies AuditMessage,

  // ============================================================================
  // DOCUMENTS - Documentos fiscais
  // ============================================================================

  /** NF-e emitida */
  NFE_EMIT: {
    action: AuditAction.CREATE,
    entity: AuditEntity.OTHER,
    module: AuditModule.SYSTEM,
    description:
      '{{userName}} emitiu a NF-e nº {{documentNumber}} para {{recipientName}} (valor: R$ {{totalValue}})',
  } satisfies AuditMessage,

  /** NFC-e emitida */
  NFCE_EMIT: {
    action: AuditAction.CREATE,
    entity: AuditEntity.OTHER,
    module: AuditModule.SYSTEM,
    description:
      '{{userName}} emitiu a NFC-e nº {{documentNumber}} para {{recipientName}} (valor: R$ {{totalValue}})',
  } satisfies AuditMessage,

  /** Documento fiscal cancelado */
  DOCUMENT_CANCEL: {
    action: AuditAction.CANCEL,
    entity: AuditEntity.OTHER,
    module: AuditModule.SYSTEM,
    description:
      '{{userName}} cancelou o documento fiscal nº {{documentNumber}} (motivo: {{cancelReason}})',
  } satisfies AuditMessage,

  /** Carta de correção enviada */
  CORRECTION_LETTER: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.OTHER,
    module: AuditModule.SYSTEM,
    description:
      '{{userName}} enviou carta de correção para o documento nº {{documentNumber}}',
  } satisfies AuditMessage,
} as const;
