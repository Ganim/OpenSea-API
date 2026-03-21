import { CentralUser } from '@/entities/core/central-user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CentralUser as PrismaCentralUser,
  User as PrismaUser,
  UserProfile as PrismaUserProfile,
} from '@prisma/generated/client';

type CentralUserWithRelations = PrismaCentralUser & {
  user?: PrismaUser & { profile?: PrismaUserProfile | null };
};

export interface CentralUserDTO {
  id: string;
  userId: string;
  role: string;
  isActive: boolean;
  invitedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    email: string;
    username: string | null;
    profile?: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

export function centralUserPrismaToDomain(
  raw: CentralUserWithRelations,
): CentralUser {
  return CentralUser.create(
    {
      id: new UniqueEntityID(raw.id),
      userId: raw.userId,
      role: raw.role,
      isActive: true,
      invitedBy: null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function centralUserToDTO(
  centralUser: CentralUser,
  prismaRaw?: CentralUserWithRelations,
): CentralUserDTO {
  const dto: CentralUserDTO = {
    id: centralUser.centralUserId.toString(),
    userId: centralUser.userId,
    role: centralUser.role,
    isActive: centralUser.isActive,
    invitedBy: centralUser.invitedBy,
    createdAt: centralUser.createdAt,
    updatedAt: centralUser.updatedAt ?? centralUser.createdAt,
  };

  if (prismaRaw?.user) {
    dto.user = {
      email: prismaRaw.user.email,
      username: prismaRaw.user.username,
      profile: prismaRaw.user.profile
        ? {
            firstName: prismaRaw.user.profile.firstName,
            lastName: prismaRaw.user.profile.lastName,
            avatarUrl: prismaRaw.user.profile.avatarUrl,
          }
        : null,
    };
  }

  return dto;
}

export function centralUserToPrisma(centralUser: CentralUser) {
  return {
    id: centralUser.centralUserId.toString(),
    userId: centralUser.userId,
    role: centralUser.role as PrismaCentralUser['role'],
  };
}
