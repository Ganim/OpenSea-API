import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

export const FINANCE_AUDIT_MESSAGES = {
  // ============================================================================
  // COST CENTERS - Centros de Custo
  // ============================================================================

  COST_CENTER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.COST_CENTER,
    module: AuditModule.FINANCE,
    description: '{{userName}} criou o centro de custo {{costCenterName}}',
  } satisfies AuditMessage,

  COST_CENTER_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.COST_CENTER,
    module: AuditModule.FINANCE,
    description: '{{userName}} atualizou o centro de custo {{costCenterName}}',
  } satisfies AuditMessage,

  COST_CENTER_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.COST_CENTER,
    module: AuditModule.FINANCE,
    description: '{{userName}} excluiu o centro de custo {{costCenterName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // BANK ACCOUNTS - Contas Bancárias
  // ============================================================================

  BANK_ACCOUNT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.BANK_ACCOUNT,
    module: AuditModule.FINANCE,
    description: '{{userName}} criou a conta bancária {{bankAccountName}}',
  } satisfies AuditMessage,

  BANK_ACCOUNT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.BANK_ACCOUNT,
    module: AuditModule.FINANCE,
    description: '{{userName}} atualizou a conta bancária {{bankAccountName}}',
  } satisfies AuditMessage,

  BANK_ACCOUNT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.BANK_ACCOUNT,
    module: AuditModule.FINANCE,
    description: '{{userName}} excluiu a conta bancária {{bankAccountName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // FINANCE CATEGORIES - Categorias Financeiras
  // ============================================================================

  FINANCE_CATEGORY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.FINANCE_CATEGORY,
    module: AuditModule.FINANCE,
    description: '{{userName}} criou a categoria financeira {{categoryName}}',
  } satisfies AuditMessage,

  FINANCE_CATEGORY_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.FINANCE_CATEGORY,
    module: AuditModule.FINANCE,
    description: '{{userName}} atualizou a categoria financeira {{categoryName}}',
  } satisfies AuditMessage,

  FINANCE_CATEGORY_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.FINANCE_CATEGORY,
    module: AuditModule.FINANCE,
    description: '{{userName}} excluiu a categoria financeira {{categoryName}}',
  } satisfies AuditMessage,
} as const;
