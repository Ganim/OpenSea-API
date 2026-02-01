import { Email } from '@/entities/core/value-objects/email';
import { IpAddress } from '@/entities/core/value-objects/ip-address';
import { Password } from '@/entities/core/value-objects/password';
import { Token } from '@/entities/core/value-objects/token';
import { Username } from '@/entities/core/value-objects/username';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Prisma } from '@prisma/generated/client.js';
import { mapUserProfilePrismaToDomain } from './user-profile-prisma-to-domain';

export function mapUserPrismaToDomain(
  userDb: Prisma.UserGetPayload<{ include: { profile: true } }>,
) {
  return {
    id: new UniqueEntityID(userDb.id),
    username: Username.create(userDb.username ?? ''),
    email: Email.create(userDb.email),
    password: Password.fromHash(userDb.password_hash),
    lastLoginIp: userDb.lastLoginIp
      ? IpAddress.create(userDb.lastLoginIp)
      : undefined,
    failedLoginAttempts: userDb.failedLoginAttempts,
    blockedUntil: userDb.blockedUntil ?? undefined,
    deletedAt: userDb.deletedAt ?? undefined,
    passwordResetToken: userDb.passwordResetToken
      ? Token.create(userDb.passwordResetToken)
      : undefined,
    passwordResetExpires: userDb.passwordResetExpires ?? undefined,
    forcePasswordReset: userDb.forcePasswordReset ?? false,
    forcePasswordResetReason: userDb.forcePasswordResetReason ?? undefined,
    forcePasswordResetRequestedBy:
      userDb.forcePasswordResetRequestedBy ?? undefined,
    forcePasswordResetRequestedAt:
      userDb.forcePasswordResetRequestedAt ?? undefined,
    isSuperAdmin: userDb.isSuperAdmin ?? false,
    lastLoginAt: userDb.lastLoginAt ?? undefined,
    createdAt: userDb.createdAt,
    updatedAt: userDb.updatedAt,
    profile: userDb.profile
      ? mapUserProfilePrismaToDomain(userDb.profile, userDb.id)
      : null,
  };
}
