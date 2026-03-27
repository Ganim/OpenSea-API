import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import type { UniqueEntityID } from '../domain/unique-entity-id';

export type AuthLinkProvider =
  | 'EMAIL'
  | 'CPF'
  | 'ENROLLMENT'
  | 'GOOGLE'
  | 'MICROSOFT'
  | 'APPLE'
  | 'GITHUB';

export type AuthLinkStatus = 'ACTIVE' | 'INACTIVE';

export interface AuthLinkProps {
  userId: UniqueEntityID;
  tenantId: UniqueEntityID | null;
  provider: AuthLinkProvider;
  identifier: string;
  credential: string | null;
  metadata: Record<string, unknown> | null;
  status: AuthLinkStatus;
  linkedAt: Date;
  unlinkedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthLink extends Entity<AuthLinkProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get tenantId(): UniqueEntityID | null {
    return this.props.tenantId;
  }

  get provider(): AuthLinkProvider {
    return this.props.provider;
  }

  get identifier(): string {
    return this.props.identifier;
  }

  get credential(): string | null {
    return this.props.credential;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get status(): AuthLinkStatus {
    return this.props.status;
  }

  set status(value: AuthLinkStatus) {
    this.props.status = value;
    this.props.updatedAt = new Date();
  }

  get linkedAt(): Date {
    return this.props.linkedAt;
  }

  get unlinkedAt(): Date | null {
    return this.props.unlinkedAt;
  }

  set unlinkedAt(value: Date | null) {
    this.props.unlinkedAt = value;
    this.props.updatedAt = new Date();
  }

  get lastUsedAt(): Date | null {
    return this.props.lastUsedAt;
  }

  set lastUsedAt(value: Date | null) {
    this.props.lastUsedAt = value;
    this.props.updatedAt = new Date();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get isActive(): boolean {
    return this.props.status === 'ACTIVE' && this.props.unlinkedAt === null;
  }

  get isLinked(): boolean {
    return this.props.unlinkedAt === null;
  }

  get hasCredential(): boolean {
    return this.props.credential !== null;
  }

  get isGlobal(): boolean {
    return this.props.tenantId === null;
  }

  // Methods
  deactivate(): void {
    this.props.status = 'INACTIVE';
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  unlink(): void {
    this.props.unlinkedAt = new Date();
    this.props.status = 'INACTIVE';
    this.props.updatedAt = new Date();
  }

  updateCredential(hash: string): void {
    this.props.credential = hash;
    this.props.updatedAt = new Date();
  }

  touchLastUsed(): void {
    this.props.lastUsedAt = new Date();
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      AuthLinkProps,
      | 'status'
      | 'linkedAt'
      | 'unlinkedAt'
      | 'lastUsedAt'
      | 'createdAt'
      | 'updatedAt'
      | 'credential'
      | 'metadata'
    >,
    id?: UniqueEntityID,
  ) {
    return new AuthLink(
      {
        ...props,
        status: props.status ?? 'ACTIVE',
        credential: props.credential ?? null,
        metadata: props.metadata ?? null,
        linkedAt: props.linkedAt ?? new Date(),
        unlinkedAt: props.unlinkedAt ?? null,
        lastUsedAt: props.lastUsedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
