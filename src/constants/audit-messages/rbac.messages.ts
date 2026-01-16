import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo RBAC (Role-Based Access Control)
 *
 * Inclui: Permissions, Permission Groups, Associações usuário-grupo,
 * Associações grupo-permissão, Permissões diretas
 */
export const RBAC_AUDIT_MESSAGES = {
  // ============================================================================
  // PERMISSIONS - Gestão de permissões
  // ============================================================================

  /** Nova permissão criada */
  PERMISSION_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PERMISSION,
    module: AuditModule.RBAC,
    description: '{{adminName}} criou a permissão {{permissionCode}}',
  } satisfies AuditMessage,

  /** Permissão atualizada */
  PERMISSION_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PERMISSION,
    module: AuditModule.RBAC,
    description: '{{adminName}} atualizou a permissão {{permissionCode}}',
  } satisfies AuditMessage,

  /** Permissão excluída */
  PERMISSION_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PERMISSION,
    module: AuditModule.RBAC,
    description: '{{adminName}} excluiu a permissão {{permissionCode}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PERMISSION GROUPS - Gestão de grupos de permissões
  // ============================================================================

  /** Novo grupo de permissões criado */
  PERMISSION_GROUP_CREATE: {
    action: AuditAction.CREATE,
    entity: AuditEntity.PERMISSION_GROUP,
    module: AuditModule.RBAC,
    description: '{{adminName}} criou o grupo de permissões {{groupName}}',
  } satisfies AuditMessage,

  /** Grupo de permissões atualizado */
  PERMISSION_GROUP_UPDATE: {
    action: AuditAction.UPDATE,
    entity: AuditEntity.PERMISSION_GROUP,
    module: AuditModule.RBAC,
    description: '{{adminName}} atualizou o grupo de permissões {{groupName}}',
  } satisfies AuditMessage,

  /** Grupo de permissões excluído */
  PERMISSION_GROUP_DELETE: {
    action: AuditAction.DELETE,
    entity: AuditEntity.PERMISSION_GROUP,
    module: AuditModule.RBAC,
    description: '{{adminName}} excluiu o grupo de permissões {{groupName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ASSOCIAÇÕES GRUPO-PERMISSÃO
  // ============================================================================

  /** Permissão adicionada a um grupo */
  PERMISSION_ADD_TO_GROUP: {
    action: AuditAction.PERMISSION_ADD_TO_GROUP,
    entity: AuditEntity.PERMISSION_GROUP_PERMISSION,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} adicionou a permissão {{permissionCode}} ao grupo {{groupName}}',
  } satisfies AuditMessage,

  /** Múltiplas permissões adicionadas a um grupo (bulk) */
  PERMISSION_BULK_ADD_TO_GROUP: {
    action: AuditAction.PERMISSION_ADD_TO_GROUP,
    entity: AuditEntity.PERMISSION_GROUP_PERMISSION,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} adicionou {{count}} permissões ao grupo {{groupName}}',
  } satisfies AuditMessage,

  /** Permissão removida de um grupo */
  PERMISSION_REMOVE_FROM_GROUP: {
    action: AuditAction.PERMISSION_REMOVE_FROM_GROUP,
    entity: AuditEntity.PERMISSION_GROUP_PERMISSION,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} removeu a permissão {{permissionCode}} do grupo {{groupName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // ASSOCIAÇÕES USUÁRIO-GRUPO
  // ============================================================================

  /** Grupo atribuído a um usuário */
  GROUP_ASSIGN_TO_USER: {
    action: AuditAction.GROUP_ASSIGN,
    entity: AuditEntity.USER_PERMISSION_GROUP,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} atribuiu o grupo {{groupName}} ao usuário {{userName}}',
  } satisfies AuditMessage,

  /** Grupo removido de um usuário */
  GROUP_REMOVE_FROM_USER: {
    action: AuditAction.GROUP_REMOVE,
    entity: AuditEntity.USER_PERMISSION_GROUP,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} removeu o grupo {{groupName}} do usuário {{userName}}',
  } satisfies AuditMessage,

  // ============================================================================
  // PERMISSÕES DIRETAS (não associadas a grupos)
  // ============================================================================

  /** Permissão direta concedida a um usuário */
  DIRECT_PERMISSION_GRANT: {
    action: AuditAction.PERMISSION_GRANT,
    entity: AuditEntity.USER_DIRECT_PERMISSION,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} concedeu a permissão {{permissionCode}} diretamente para {{userName}}',
  } satisfies AuditMessage,

  /** Permissão direta revogada de um usuário */
  DIRECT_PERMISSION_REVOKE: {
    action: AuditAction.PERMISSION_REVOKE,
    entity: AuditEntity.USER_DIRECT_PERMISSION,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} revogou a permissão {{permissionCode}} de {{userName}}',
  } satisfies AuditMessage,

  /** Permissão direta de um usuário atualizada */
  DIRECT_PERMISSION_UPDATE: {
    action: AuditAction.PERMISSION_UPDATE,
    entity: AuditEntity.USER_DIRECT_PERMISSION,
    module: AuditModule.RBAC,
    description:
      '{{adminName}} atualizou a permissão direta {{permissionCode}} de {{userName}}',
  } satisfies AuditMessage,
} as const;

export type RbacAuditMessageKey = keyof typeof RBAC_AUDIT_MESSAGES;
