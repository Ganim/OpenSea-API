import { User } from '@/entities/core/user';
import type { Email } from '@/entities/core/value-objects/email';
import type { Token } from '@/entities/core/value-objects/token';
import { Username } from '@/entities/core/value-objects/username';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { mapUserPrismaToDomain } from '@/mappers/core/user/user-prisma-to-domain';
import type {
  CreateUserSchema,
  UpdateUserSchema,
  UsersRepository,
} from '../users-repository';

export class PrismaUsersRepository implements UsersRepository {
  // CREATE
  // -create(data: CreateUserSchema): Promise<User>;

  async create(data: CreateUserSchema): Promise<User> {
    const newUserData = await prisma.user.create({
      data: {
        username: data.username.toString(),
        email: data.email.toString(),
        password_hash: data.passwordHash.toString(),
        // Campos com valores default explícitos (bug do Prisma 7 com PrismaPg adapter)
        failedLoginAttempts: 0,
        forcePasswordReset: false,
        profile: {
          create: {
            name: data.profile.name,
            surname: data.profile.surname,
            birthday: data.profile.birthday,
            location: data.profile.location,
            bio: data.profile.bio,
            avatarUrl: data.profile.avatarUrl.toString(),
          },
        },
      },
      include: { profile: true },
    });

    // Atribuir automaticamente o grupo "user" ao novo usuário
    // Este é o comportamento padrão para todos os novos cadastros
    const userGroup = await prisma.permissionGroup.findFirst({
      where: { slug: 'user', deletedAt: null },
    });

    if (userGroup) {
      await prisma.userPermissionGroup.create({
        data: {
          userId: newUserData.id,
          groupId: userGroup.id,
          grantedBy: null, // Sistema
        },
      });
    }

    const user = User.create(mapUserPrismaToDomain(newUserData));
    return user;
  }

  // UPDATE / PATCH
  // - update(data: UpdateUserSchema): Promise<User | null>;
  // - updateLastLoginAt(id: UniqueEntityID, date: Date): Promise<User | null>;
  // - updatePasswordReset(id: UniqueEntityID, token: Token, expires: Date): Promise<User | null>;

  async update(data: UpdateUserSchema): Promise<User | null> {
    try {
      const newUserData = await prisma.user.update({
        where: { id: data.id.toString() },
        data: {
          username: data.username
            ? data.username instanceof Username
              ? data.username.value
              : typeof data.username === 'string'
                ? data.username
                : ''
            : undefined,
          email: data.email ? data.email.toString() : undefined,
          password_hash: data.passwordHash
            ? data.passwordHash.toString()
            : undefined,
          failedLoginAttempts: data.failedLoginAttempts,
          blockedUntil: data.blockedUntil ?? undefined,
          profile: data.profile
            ? {
                upsert: {
                  create: {
                    name: data.profile.name ?? '',
                    surname: data.profile.surname ?? '',
                    birthday: data.profile.birthday,
                    location: data.profile.location ?? '',
                    bio: data.profile.bio ?? '',
                    avatarUrl: data.profile.avatarUrl?.toString() ?? '',
                  },
                  update: {
                    name: data.profile.name,
                    surname: data.profile.surname,
                    birthday: data.profile.birthday,
                    location: data.profile.location,
                    bio: data.profile.bio,
                    avatarUrl: data.profile.avatarUrl?.toString(),
                  },
                },
              }
            : undefined,
        },
        include: { profile: true },
      });

      const user = User.create(mapUserPrismaToDomain(newUserData));
      return user;
    } catch {
      return null;
    }
  }

  async updateLastLoginAt(
    id: UniqueEntityID,
    date: Date,
  ): Promise<User | null> {
    try {
      const newUserData = await prisma.user.update({
        where: { id: id.toString() },
        data: { lastLoginAt: date },
        include: { profile: true },
      });
      return User.create(mapUserPrismaToDomain(newUserData));
    } catch {
      return null;
    }
  }

  async updatePasswordReset(
    id: UniqueEntityID,
    token: Token,
    expires: Date,
  ): Promise<User | null> {
    try {
      const newUserData = await prisma.user.update({
        where: { id: id.toString() },
        data: {
          passwordResetToken: token.value,
          passwordResetExpires: expires,
        },
        include: { profile: true },
      });
      return User.create(mapUserPrismaToDomain(newUserData));
    } catch {
      return null;
    }
  }

  // DELETE
  // - delete(id: UniqueEntityID): Promise<void>;

  async delete(id: UniqueEntityID): Promise<void | null> {
    try {
      await prisma.user.update({
        where: { id: id.toString() },
        data: { deletedAt: new Date() },
      });
    } catch {
      return null;
    }
  }

  // RETRIEVE
  // - findByEmail(email: Email): Promise<User | null>;
  // - findById(id: UniqueEntityID): Promise<User | null>;
  // - findByUsername(username: Username): Promise<User | null>;
  // - findByPasswordResetToken(token: Token): Promise<User | null>;

  async findByEmail(email: Email): Promise<User | null> {
    const newUserData = await prisma.user.findFirst({
      where: { email: email.value, deletedAt: null },
      include: { profile: true },
    });

    if (!newUserData) return null;

    const user = User.create(mapUserPrismaToDomain(newUserData));
    return user;
  }

  async findById(
    id: UniqueEntityID,
    ignoreDeleted?: boolean,
  ): Promise<User | null> {
    const where: Record<string, unknown> = { id: id.toString() };

    if (!ignoreDeleted) where.deletedAt = null;

    const newUserData = await prisma.user.findFirst({
      where,
      include: { profile: true },
    });

    if (!newUserData) return null;

    const user = User.create(mapUserPrismaToDomain(newUserData));
    return user;
  }

  async findByUsername(username: Username): Promise<User | null> {
    const usernameValue = username instanceof Username ? username.value : '';

    const newUserData = await prisma.user.findFirst({
      where: { username: usernameValue, deletedAt: null },
      include: { profile: true },
    });

    if (!newUserData) return null;

    const user = User.create(mapUserPrismaToDomain(newUserData));

    return user;
  }

  async findByPasswordResetToken(token: Token): Promise<User | null> {
    const newUserData = await prisma.user.findFirst({
      where: { passwordResetToken: token.value, deletedAt: null },
      include: { profile: true },
    });

    if (!newUserData) return null;

    const user = User.create(mapUserPrismaToDomain(newUserData));
    return user;
  }

  async findManyByIds(ids: UniqueEntityID[]): Promise<User[]> {
    const userIds = ids.map((id) => id.toString());

    const usersDb = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
      include: { profile: true },
    });

    return usersDb.map((userDb) => User.create(mapUserPrismaToDomain(userDb)));
  }

  // LIST
  // - listAll(): Promise<User[]>;

  async listAll(): Promise<User[] | null> {
    const usersDb = await prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { email: 'asc' },
      take: 1000, // Limit to prevent PostgreSQL parameter overflow
      include: { profile: true },
    });

    if (!usersDb || usersDb.length === 0) return null;

    const userList = usersDb.map((userDb) =>
      User.create(mapUserPrismaToDomain(userDb)),
    );

    return userList;
  }

  // FORCED PASSWORD RESET
  async setForcePasswordReset(
    id: UniqueEntityID,
    requestedBy: UniqueEntityID | null,
    reason?: string,
  ): Promise<User | null> {
    try {
      const newUserData = await prisma.user.update({
        where: { id: id.toString() },
        data: {
          forcePasswordReset: true,
          forcePasswordResetReason: reason ?? null,
          forcePasswordResetRequestedBy: requestedBy?.toString() ?? null,
          forcePasswordResetRequestedAt: new Date(),
        },
        include: { profile: true },
      });

      return User.create(mapUserPrismaToDomain(newUserData));
    } catch {
      return null;
    }
  }

  async clearForcePasswordReset(id: UniqueEntityID): Promise<User | null> {
    try {
      const newUserData = await prisma.user.update({
        where: { id: id.toString() },
        data: {
          forcePasswordReset: false,
          forcePasswordResetReason: null,
          forcePasswordResetRequestedBy: null,
          forcePasswordResetRequestedAt: null,
        },
        include: { profile: true },
      });

      return User.create(mapUserPrismaToDomain(newUserData));
    } catch {
      return null;
    }
  }
}
