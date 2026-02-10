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

  // ============================================================================
  // FINANCE ENTRIES - Lançamentos Financeiros
  // ============================================================================

  FINANCE_ENTRY_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.FINANCE_ENTRY,
    module: AuditModule.FINANCE,
    description: '{{userName}} criou o lançamento {{entryCode}}',
  } satisfies AuditMessage,

  FINANCE_ENTRY_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.FINANCE_ENTRY,
    module: AuditModule.FINANCE,
    description: '{{userName}} atualizou o lançamento {{entryCode}}',
  } satisfies AuditMessage,

  FINANCE_ENTRY_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.FINANCE_ENTRY,
    module: AuditModule.FINANCE,
    description: '{{userName}} excluiu o lançamento {{entryCode}}',
  } satisfies AuditMessage,

  FINANCE_ENTRY_CANCEL: {
    action: AuditAction.ENTRY_CANCEL,
    entity: AuditEntity.FINANCE_ENTRY,
    module: AuditModule.FINANCE,
    description: '{{userName}} cancelou o lançamento {{entryCode}}',
  } satisfies AuditMessage,

  FINANCE_ENTRY_PAYMENT: {
    action: AuditAction.PAYMENT_REGISTER,
    entity: AuditEntity.FINANCE_ENTRY_PAYMENT,
    module: AuditModule.FINANCE,
    description: '{{userName}} registrou pagamento de R$ {{amount}} no lançamento {{entryCode}}',
  } satisfies AuditMessage,

  // ============================================================================
  // FINANCE ATTACHMENTS - Anexos Financeiros
  // ============================================================================

  FINANCE_ATTACHMENT_UPLOAD: {
    action: AuditAction.CREATE,
    entity: AuditEntity.FINANCE_ATTACHMENT,
    module: AuditModule.FINANCE,
    description: '{{userName}} anexou {{fileName}} ao lançamento {{entryCode}}',
  } satisfies AuditMessage,

  FINANCE_ATTACHMENT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.FINANCE_ATTACHMENT,
    module: AuditModule.FINANCE,
    description: '{{userName}} removeu o anexo {{fileName}} do lançamento {{entryCode}}',
  } satisfies AuditMessage,

  // ============================================================================
  // LOANS - Emprestimos e Financiamentos
  // ============================================================================

  LOAN_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.LOAN,
    module: AuditModule.FINANCE,
    description: '{{userName}} criou o emprestimo {{loanName}}',
  } satisfies AuditMessage,

  LOAN_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.LOAN,
    module: AuditModule.FINANCE,
    description: '{{userName}} atualizou o emprestimo {{loanName}}',
  } satisfies AuditMessage,

  LOAN_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.LOAN,
    module: AuditModule.FINANCE,
    description: '{{userName}} excluiu o emprestimo {{loanName}}',
  } satisfies AuditMessage,

  LOAN_PAYMENT: {
    action: AuditAction.PAYMENT_REGISTER,
    entity: AuditEntity.LOAN_INSTALLMENT,
    module: AuditModule.FINANCE,
    description: '{{userName}} registrou pagamento de R$ {{amount}} no emprestimo {{loanName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // CONSORTIA - Consorcios
  // ============================================================================

  CONSORTIUM_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.CONSORTIUM,
    module: AuditModule.FINANCE,
    description: '{{userName}} criou o consorcio {{consortiumName}}',
  } satisfies AuditMessage,

  CONSORTIUM_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.CONSORTIUM,
    module: AuditModule.FINANCE,
    description: '{{userName}} atualizou o consorcio {{consortiumName}}',
  } satisfies AuditMessage,

  CONSORTIUM_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.CONSORTIUM,
    module: AuditModule.FINANCE,
    description: '{{userName}} excluiu o consorcio {{consortiumName}}',
  } satisfies AuditMessage,

  CONSORTIUM_PAYMENT: {
    action: AuditAction.PAYMENT_REGISTER,
    entity: AuditEntity.CONSORTIUM_PAYMENT,
    module: AuditModule.FINANCE,
    description: '{{userName}} registrou pagamento de R$ {{amount}} no consorcio {{consortiumName}}',
  } satisfies AuditMessage,

  CONSORTIUM_CONTEMPLATION: {
    action: AuditAction.CONTEMPLATION,
    entity: AuditEntity.CONSORTIUM,
    module: AuditModule.FINANCE,
    description: '{{userName}} marcou o consorcio {{consortiumName}} como contemplado ({{contemplationType}})',
  } satisfies AuditMessage,
} as const;
