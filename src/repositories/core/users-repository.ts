import { User } from '@/entities/core/user';
import { UserProfile } from '@/entities/core/user-profile';
import type { Email } from '@/entities/core/value-objects/email';
import type { Password } from '@/entities/core/value-objects/password';
import type { Token } from '@/entities/core/value-objects/token';
import type { Url } from '@/entities/core/value-objects/url';
import type { Username } from '@/entities/core/value-objects/username';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreateUserSchema {
  username: Username;
  email: Email;
  passwordHash: Password;
  profile: {
    name: string;
    surname: string;
    birthday: Date | null;
    location: string;
    bio: string;
    avatarUrl: Url;
  };
  deletedAt?: Date | null;
}

export interface UpdateUserSchema {
  id: UniqueEntityID;
  email?: Email;
  username?: Username;
  passwordHash?: Password;
  profile?: UserProfile;
  failedLoginAttempts?: number;
  lastLoginIp?: string | null;
  passwordResetToken?: Token | null;
  passwordResetExpires?: Date | null;
  blockedUntil?: Date | null;
  deletedAt?: Date | null;
  forcePasswordReset?: boolean;
  forcePasswordResetReason?: string | null;
  forcePasswordResetRequestedBy?: string | null;
  forcePasswordResetRequestedAt?: Date | null;
}

export interface UsersRepository {
  // CREATE
  create(data: CreateUserSchema): Promise<User>;

  // UPDATE / PATCH
  update(data: UpdateUserSchema): Promise<User | null>;
  updateLastLoginAt(id: UniqueEntityID, date: Date): Promise<User | null>;
  updatePasswordReset(
    id: UniqueEntityID,
    token: Token,
    expires: Date,
  ): Promise<User | null>;

  // DELETE
  delete(id: UniqueEntityID): Promise<void | null>;

  // RETRIEVE
  findByEmail(email: Email): Promise<User | null>;
  findById(id: UniqueEntityID, ignoreDeleted?: boolean): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  findByPasswordResetToken(token: Token): Promise<User | null>;
  findManyByIds(ids: UniqueEntityID[]): Promise<User[]>;

  // LIST
  listAll(): Promise<User[] | null>;

  // FORCED PASSWORD RESET
  setForcePasswordReset(
    id: UniqueEntityID,
    requestedBy: UniqueEntityID | null,
    reason?: string,
  ): Promise<User | null>;
  clearForcePasswordReset(id: UniqueEntityID): Promise<User | null>;
}
