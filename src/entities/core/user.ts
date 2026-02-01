import dayjs from 'dayjs';
import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { UserProfile } from './user-profile';
import { Email } from './value-objects/email';
import { IpAddress } from './value-objects/ip-address';
import { Password } from './value-objects/password';
import { Token } from './value-objects/token';
import { Username } from './value-objects/username';

export interface UserProps {
  id: UniqueEntityID;
  username: Username;
  email: Email;
  password: Password;
  lastLoginIp?: IpAddress;
  failedLoginAttempts: number;
  blockedUntil?: Date;
  passwordResetToken?: Token;
  passwordResetExpires?: Date;
  forcePasswordReset: boolean;
  forcePasswordResetReason?: string;
  forcePasswordResetRequestedBy?: string;
  forcePasswordResetRequestedAt?: Date;
  isSuperAdmin: boolean;
  deletedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  profile: UserProfile | null;
}

export class User extends Entity<UserProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get username(): Username {
    return this.props.username;
  }
  get email(): Email {
    return this.props.email;
  }
  get password(): Password {
    return this.props.password;
  }
  get lastLoginIp(): IpAddress | undefined {
    return this.props.lastLoginIp;
  }
  get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts;
  }
  get blockedUntil(): Date | undefined {
    return this.props.blockedUntil;
  }
  get passwordResetToken(): Token | undefined {
    return this.props.passwordResetToken;
  }
  get passwordResetExpires(): Date | undefined {
    return this.props.passwordResetExpires;
  }
  get forcePasswordReset(): boolean {
    return this.props.forcePasswordReset;
  }
  get forcePasswordResetReason(): string | undefined {
    return this.props.forcePasswordResetReason;
  }
  get forcePasswordResetRequestedBy(): string | undefined {
    return this.props.forcePasswordResetRequestedBy;
  }
  get forcePasswordResetRequestedAt(): Date | undefined {
    return this.props.forcePasswordResetRequestedAt;
  }
  get isSuperAdmin(): boolean {
    return this.props.isSuperAdmin;
  }
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }
  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
  get profile(): UserProfile | null {
    return this.props.profile;
  }

  get isBlocked(): boolean {
    return !!this.blockedUntil && dayjs().isBefore(this.blockedUntil);
  }

  get isDeleted(): boolean {
    return !!this.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set email(email: Email) {
    this.props.email = email;
    this.touch();
  }

  set username(username: Username) {
    this.props.username = username;
    this.touch();
  }

  set password(password: Password) {
    this.props.password = password;
    this.touch();
  }

  set profile(profile: UserProfile | null) {
    this.props.profile = profile;
    this.touch();
  }

  set blockedUntil(date: Date | undefined) {
    this.props.blockedUntil = date;
  }

  set passwordResetExpires(date: Date | undefined) {
    this.props.passwordResetExpires = date;
  }

  set deletedAt(date: Date | undefined) {
    this.props.deletedAt = date;
    this.touch();
  }

  set lastLoginIp(ip: IpAddress | undefined) {
    this.props.lastLoginIp = ip;
  }

  set lastLoginAt(date: Date | undefined) {
    this.props.lastLoginAt = date;
  }

  set passwordResetToken(token: Token | undefined) {
    this.props.passwordResetToken = token;
  }

  set failedLoginAttempts(attempts: number) {
    this.props.failedLoginAttempts = attempts;
  }

  set forcePasswordReset(value: boolean) {
    this.props.forcePasswordReset = value;
    this.touch();
  }

  set forcePasswordResetReason(reason: string | undefined) {
    this.props.forcePasswordResetReason = reason;
  }

  set forcePasswordResetRequestedBy(userId: string | undefined) {
    this.props.forcePasswordResetRequestedBy = userId;
  }

  set forcePasswordResetRequestedAt(date: Date | undefined) {
    this.props.forcePasswordResetRequestedAt = date;
  }

  clearForcedPasswordReset(): void {
    this.props.forcePasswordReset = false;
    this.props.forcePasswordResetReason = undefined;
    this.props.forcePasswordResetRequestedBy = undefined;
    this.props.forcePasswordResetRequestedAt = undefined;
    this.touch();
  }

  static create(
    props: Optional<
      UserProps,
      | 'createdAt'
      | 'failedLoginAttempts'
      | 'deletedAt'
      | 'forcePasswordReset'
      | 'isSuperAdmin'
    >,
    id?: UniqueEntityID,
  ) {
    const user = new User(
      {
        ...props,
        failedLoginAttempts: props.failedLoginAttempts ?? 0,
        forcePasswordReset: props.forcePasswordReset ?? false,
        isSuperAdmin: props.isSuperAdmin ?? false,
        createdAt: props.createdAt ?? new Date(),
        deletedAt: props.deletedAt ?? undefined,
      },
      id,
    );
    return user;
  }
}
