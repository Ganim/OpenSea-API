import { User } from '@/entities/core/user';
import { userProfileToDTO, type UserProfileDTO } from './user-profile-to-dto';

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  lastLoginAt: Date | null;
  profile: UserProfileDTO | null;
  deletedAt?: Date | null;
  forcePasswordReset?: boolean;
  forcePasswordResetReason?: string | null;
  forcePasswordResetRequestedAt?: Date | null;
}

export function userToDTO(user: User): UserDTO {
  return {
    id: user.id.toString(),
    email: user.email.value,
    username: user.username.value,
    lastLoginAt: user.lastLoginAt ?? null,
    profile: user.profile ? userProfileToDTO(user.profile) : null,
    deletedAt: user.deletedAt ?? null,
    forcePasswordReset: user.forcePasswordReset,
    forcePasswordResetReason: user.forcePasswordResetReason ?? null,
    forcePasswordResetRequestedAt: user.forcePasswordResetRequestedAt ?? null,
  };
}
