/**
 * Permission Group Constants
 *
 * Slugs dos grupos de permissão padrão do sistema.
 * Estes grupos são criados automaticamente no seed.
 *
 * FILOSOFIA:
 * - ADMIN: Acesso total a todas as permissões
 * - USER: Acesso apenas às permissões self.* (próprios dados)
 *
 * Demais grupos são criados pelo administrador conforme a estrutura
 * organizacional da empresa (ex: gerente-estoque, vendedor, supervisor-rh).
 */

export const PermissionGroupSlugs = {
  /**
   * Grupo Admin - Acesso total ao sistema
   * Todas as permissões são concedidas automaticamente
   */
  ADMIN: 'admin',

  /**
   * Grupo User - Acesso apenas aos próprios dados
   * Recebe apenas permissões self.*
   *
   * NOTA: Notificações e preferências do próprio usuário são
   * implícitas à autenticação e não precisam de permissão.
   */
  USER: 'user',
} as const;

export type PermissionGroupSlug =
  (typeof PermissionGroupSlugs)[keyof typeof PermissionGroupSlugs];

/**
 * Cores dos grupos (hexadecimal)
 * Usadas na interface para identificação visual
 */
export const PermissionGroupColors = {
  [PermissionGroupSlugs.ADMIN]: '#DC2626', // red-600
  [PermissionGroupSlugs.USER]: '#2563EB', // blue-600
} as const;

/**
 * Prioridades dos grupos
 * Usadas para resolver conflitos quando um usuário tem múltiplos grupos
 */
export const PermissionGroupPriorities = {
  [PermissionGroupSlugs.ADMIN]: 100,
  [PermissionGroupSlugs.USER]: 10,
} as const;

/**
 * Helper para validar se um slug é de um grupo padrão do sistema
 */
export function isStandardGroup(slug: string): boolean {
  return Object.values(PermissionGroupSlugs).includes(
    slug as PermissionGroupSlug,
  );
}

/**
 * Helper para verificar se é o grupo admin
 */
export function isAdminGroup(slug: string): boolean {
  return slug === PermissionGroupSlugs.ADMIN;
}

/**
 * Helper para verificar se é o grupo user
 */
export function isUserGroup(slug: string): boolean {
  return slug === PermissionGroupSlugs.USER;
}
