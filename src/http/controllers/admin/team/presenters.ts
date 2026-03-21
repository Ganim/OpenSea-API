import type { CentralUser } from '@/entities/core/central-user';

export function presentCentralUser(centralUser: CentralUser) {
  return {
    id: centralUser.id.toString(),
    userId: centralUser.userId,
    role: centralUser.role,
    isActive: centralUser.isActive,
    invitedBy: centralUser.invitedBy,
    createdAt: centralUser.createdAt,
    updatedAt: centralUser.updatedAt,
  };
}
