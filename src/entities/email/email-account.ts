import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export type EmailAccountVisibility = 'PRIVATE' | 'SHARED';

export interface EmailAccountProps {
  tenantId: UniqueEntityID;
  ownerUserId: UniqueEntityID;
  address: string;
  displayName: string | null;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  username: string;
  encryptedSecret: string;
  visibility: EmailAccountVisibility;
  isActive: boolean;
  isDefault: boolean;
  signature: string | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** First linked team ID (read-only, populated from teamLinks join) */
  teamId?: string | null;
  /** First linked team name (read-only, populated from teamLinks join) */
  teamName?: string | null;
}

export class EmailAccount extends Entity<EmailAccountProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get ownerUserId(): UniqueEntityID {
    return this.props.ownerUserId;
  }

  get address(): string {
    return this.props.address;
  }

  get displayName(): string | null {
    return this.props.displayName;
  }

  set displayName(value: string | null) {
    this.props.displayName = value;
    this.touch();
  }

  get imapHost(): string {
    return this.props.imapHost;
  }

  set imapHost(value: string) {
    this.props.imapHost = value;
    this.touch();
  }

  get imapPort(): number {
    return this.props.imapPort;
  }

  set imapPort(value: number) {
    this.props.imapPort = value;
    this.touch();
  }

  get imapSecure(): boolean {
    return this.props.imapSecure;
  }

  set imapSecure(value: boolean) {
    this.props.imapSecure = value;
    this.touch();
  }

  get smtpHost(): string {
    return this.props.smtpHost;
  }

  set smtpHost(value: string) {
    this.props.smtpHost = value;
    this.touch();
  }

  get smtpPort(): number {
    return this.props.smtpPort;
  }

  set smtpPort(value: number) {
    this.props.smtpPort = value;
    this.touch();
  }

  get smtpSecure(): boolean {
    return this.props.smtpSecure;
  }

  set smtpSecure(value: boolean) {
    this.props.smtpSecure = value;
    this.touch();
  }

  get username(): string {
    return this.props.username;
  }

  set username(value: string) {
    this.props.username = value;
    this.touch();
  }

  get encryptedSecret(): string {
    return this.props.encryptedSecret;
  }

  set encryptedSecret(value: string) {
    this.props.encryptedSecret = value;
    this.touch();
  }

  get visibility(): EmailAccountVisibility {
    return this.props.visibility;
  }

  set visibility(value: EmailAccountVisibility) {
    this.props.visibility = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  set isDefault(value: boolean) {
    this.props.isDefault = value;
    this.touch();
  }

  get signature(): string | null {
    return this.props.signature;
  }

  set signature(value: string | null) {
    this.props.signature = value;
    this.touch();
  }

  get lastSyncAt(): Date | null {
    return this.props.lastSyncAt;
  }

  set lastSyncAt(value: Date | null) {
    this.props.lastSyncAt = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get teamId(): string | null {
    return this.props.teamId ?? null;
  }

  get teamName(): string | null {
    return this.props.teamName ?? null;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<
      EmailAccountProps,
      | 'displayName'
      | 'imapSecure'
      | 'smtpSecure'
      | 'visibility'
      | 'isActive'
      | 'isDefault'
      | 'signature'
      | 'lastSyncAt'
      | 'createdAt'
      | 'updatedAt'
    > & {
      displayName?: string | null;
      imapSecure?: boolean;
      smtpSecure?: boolean;
      visibility?: EmailAccountVisibility;
      isActive?: boolean;
      isDefault?: boolean;
      signature?: string | null;
      lastSyncAt?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
      teamId?: string | null;
      teamName?: string | null;
    },
    id?: UniqueEntityID,
  ): EmailAccount {
    return new EmailAccount(
      {
        ...props,
        displayName: props.displayName ?? null,
        imapSecure: props.imapSecure ?? true,
        smtpSecure: props.smtpSecure ?? true,
        visibility: props.visibility ?? 'PRIVATE',
        isActive: props.isActive ?? true,
        isDefault: props.isDefault ?? false,
        signature: props.signature ?? null,
        lastSyncAt: props.lastSyncAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        teamId: props.teamId ?? null,
        teamName: props.teamName ?? null,
      },
      id,
    );
  }
}
