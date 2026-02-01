import { User } from '@/entities/core/user';
import { userProfileToDTO, type UserProfileDTO } from './user-profile-to-dto';

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt?: Date | null;
  lastLoginAt: Date | null;
  profile: UserProfileDTO | null;
  deletedAt?: Date | null;
  forcePasswordReset?: boolean;
  forcePasswordResetReason?: string | null;
  forcePasswordResetRequestedAt?: Date | null;
  isSuperAdmin: boolean;
}

export function userToDTO(user: User): UserDTO {
  return {
    id: user.id.toString(),
    email: user.email.value,
    username: user.username.value,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    profile: user.profile ? userProfileToDTO(user.profile) : null,
    deletedAt: user.deletedAt ?? null,
    forcePasswordReset: user.forcePasswordReset,
    forcePasswordResetReason: user.forcePasswordResetReason ?? null,
    forcePasswordResetRequestedAt: user.forcePasswordResetRequestedAt ?? null,
    isSuperAdmin: user.isSuperAdmin,
  };
}
