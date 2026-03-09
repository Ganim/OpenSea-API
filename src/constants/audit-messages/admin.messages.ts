import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo ADMIN (Super Admin)
 *
 * Inclui: Gestão de Tenants, Planos, Usuários de Tenant, Feature Flags
 */
export const ADMIN_AUDIT_MESSAGES = {
  // ============================================================================
  // TENANTS - Gestão de Empresas
  // ============================================================================

  /** Super admin criou uma nova empresa */
  TENANT_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TENANT,
    module: AuditModule.ADMIN,
    description: '{{adminName}} criou a empresa {{tenantName}}',
  } satisfies AuditMessage,

  /** Super admin atualizou dados de uma empresa */
  TENANT_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.TENANT,
    module: AuditModule.ADMIN,
    description: '{{adminName}} atualizou a empresa {{tenantName}}',
  } satisfies AuditMessage,

  /** Super admin desativou uma empresa */
  TENANT_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TENANT,
    module: AuditModule.ADMIN,
    description: '{{adminName}} desativou a empresa {{tenantName}}',
  } satisfies AuditMessage,

  /** Super admin alterou o status de uma empresa */
  TENANT_STATUS_CHANGE: {
    action: AuditAction.STATUS_CHANGE,
    entity: AuditEntity.TENANT,
    module: AuditModule.ADMIN,
    description:
      '{{adminName}} alterou o status da empresa {{tenantName}} de {{oldStatus}} para {{newStatus}}',
  } satisfies AuditMessage,

  /** Super admin alterou o plano de uma empresa */
  TENANT_PLAN_CHANGE: {
    action: AuditAction.PLAN_CHANGE,
    entity: AuditEntity.TENANT,
    module: AuditModule.ADMIN,
    description:
      '{{adminName}} alterou o plano da empresa {{tenantName}} para {{planName}}',
  } satisfies AuditMessage,

  /** Super admin alterou feature flag de uma empresa */
  TENANT_FLAG_CHANGE: {
    action: AuditAction.FLAG_CHANGE,
    entity: AuditEntity.FEATURE_FLAG,
    module: AuditModule.ADMIN,
    description:
      '{{adminName}} {{action}} a flag {{flagName}} na empresa {{tenantName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // TENANT USERS - Gestão de Usuários de Tenant
  // ============================================================================

  /** Super admin adicionou usuário a uma empresa */
  TENANT_USER_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.TENANT_USER,
    module: AuditModule.ADMIN,
    description:
      '{{adminName}} adicionou o usuário {{userName}} à empresa {{tenantName}}',
  } satisfies AuditMessage,

  /** Super admin removeu usuário de uma empresa */
  TENANT_USER_REMOVE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.TENANT_USER,
    module: AuditModule.ADMIN,
    description:
      '{{adminName}} removeu o usuário {{userId}} da empresa {{tenantName}}',
  } satisfies AuditMessage,

  /** Super admin alterou chave de segurança de um usuário */
  TENANT_USER_SECURITY_KEY: {
    action: AuditAction.SECURITY_KEY_CHANGE,
    entity: AuditEntity.TENANT_USER,
    module: AuditModule.ADMIN,
    description:
      '{{adminName}} {{action}} a chave de segurança do usuário {{userId}} na empresa {{tenantName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PLANS - Gestão de Planos
  // ============================================================================

  /** Super admin criou um novo plano */
  PLAN_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PLAN,
    module: AuditModule.ADMIN,
    description: '{{adminName}} criou o plano {{planName}}',
  } satisfies AuditMessage,

  /** Super admin atualizou um plano */
  PLAN_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PLAN,
    module: AuditModule.ADMIN,
    description: '{{adminName}} atualizou o plano {{planName}}',
  } satisfies AuditMessage,

  /** Super admin desativou um plano */
  PLAN_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PLAN,
    module: AuditModule.ADMIN,
    description: '{{adminName}} desativou o plano {{planName}}',
  } satisfies AuditMessage,

  /** Super admin definiu módulos de um plano */
  PLAN_SET_MODULES: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PLAN,
    module: AuditModule.ADMIN,
    description:
      '{{adminName}} atualizou os módulos do plano {{planName}} ({{moduleCount}} módulos)',
  } satisfies AuditMessage,
} as const;

export type AdminAuditMessageKey = keyof typeof ADMIN_AUDIT_MESSAGES;
