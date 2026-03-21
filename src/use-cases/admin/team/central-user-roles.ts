export const VALID_CENTRAL_USER_ROLES = [
  'OWNER',
  'ADMIN',
  'SUPPORT',
  'FINANCE',
  'VIEWER',
] as const;

export type CentralUserRoleType = (typeof VALID_CENTRAL_USER_ROLES)[number];

export const ELEVATED_ROLES: CentralUserRoleType[] = ['OWNER', 'ADMIN'];

export function isValidCentralUserRole(
  role: string,
): role is CentralUserRoleType {
  return VALID_CENTRAL_USER_ROLES.includes(role as CentralUserRoleType);
}
