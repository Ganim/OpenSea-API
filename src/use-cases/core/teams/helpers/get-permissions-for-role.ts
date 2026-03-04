import type { TeamEmailAccountItem } from '@/repositories/core/team-email-accounts-repository';

export function getPermissionsForRole(
  role: 'OWNER' | 'ADMIN' | 'MEMBER',
  teamEmail: TeamEmailAccountItem,
): { canRead: boolean; canSend: boolean; canManage: boolean } {
  switch (role) {
    case 'OWNER':
      return {
        canRead: teamEmail.ownerCanRead,
        canSend: teamEmail.ownerCanSend,
        canManage: teamEmail.ownerCanManage,
      };
    case 'ADMIN':
      return {
        canRead: teamEmail.adminCanRead,
        canSend: teamEmail.adminCanSend,
        canManage: teamEmail.adminCanManage,
      };
    case 'MEMBER':
      return {
        canRead: teamEmail.memberCanRead,
        canSend: teamEmail.memberCanSend,
        canManage: teamEmail.memberCanManage,
      };
  }
}
