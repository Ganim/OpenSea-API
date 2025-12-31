/**
 * Permission Group Constants
 *
 * Slugs dos grupos de permissão padrão do sistema
 * Estes grupos são criados automaticamente no seed
 */

export const PermissionGroupSlugs = {
  /**
   * Grupo Admin - Acesso total ao sistema
   * Equivalente ao antigo Role.ADMIN
   */
  ADMIN: 'admin',

  /**
   * Grupo Manager - Acesso de gestão
   * Equivalente ao antigo Role.MANAGER
   */
  MANAGER: 'manager',

  /**
   * Grupo User - Acesso básico
   * Equivalente ao antigo Role.USER
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
  [PermissionGroupSlugs.MANAGER]: '#EA580C', // orange-600
  [PermissionGroupSlugs.USER]: '#2563EB', // blue-600
} as const;

/**
 * Prioridades dos grupos
 * Usadas para resolver conflitos quando um usuário tem múltiplos grupos
 */
export const PermissionGroupPriorities = {
  [PermissionGroupSlugs.ADMIN]: 100,
  [PermissionGroupSlugs.MANAGER]: 50,
  [PermissionGroupSlugs.USER]: 10,
} as const;

/**
 * Helper para validar se um slug é de um grupo padrão
 */
export function isStandardGroup(slug: string): boolean {
  return Object.values(PermissionGroupSlugs).includes(
    slug as PermissionGroupSlug,
  );
}
