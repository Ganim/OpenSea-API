import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import type { UniqueEntityID } from '../domain/unique-entity-id';

export interface MagicLinkTokenProps {
  userId: UniqueEntityID;
  token: string;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class MagicLinkToken extends Entity<MagicLinkTokenProps> {
  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get token(): string {
    return this.props.token;
  }

  get email(): string {
    return this.props.email;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get usedAt(): Date | null {
    return this.props.usedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Computed properties
  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  get isUsed(): boolean {
    return this.props.usedAt !== null;
  }

  get isValid(): boolean {
    return !this.isExpired && !this.isUsed;
  }

  // Methods
  markAsUsed(): void {
    this.props.usedAt = new Date();
  }

  static create(
    props: Optional<MagicLinkTokenProps, 'usedAt' | 'createdAt'>,
    id?: UniqueEntityID,
  ) {
    return new MagicLinkToken(
      {
        ...props,
        usedAt: props.usedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
