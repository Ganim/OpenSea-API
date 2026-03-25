import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MessagingChannel } from './messaging-channel.enum';

export interface MessagingContactProps {
  tenantId: UniqueEntityID;
  accountId: UniqueEntityID;
  channel: MessagingChannel;
  externalId: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  customerId: UniqueEntityID | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  isBlocked: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MessagingContact extends Entity<MessagingContactProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get accountId(): UniqueEntityID {
    return this.props.accountId;
  }

  get channel(): MessagingChannel {
    return this.props.channel;
  }

  get externalId(): string {
    return this.props.externalId;
  }

  get name(): string | null {
    return this.props.name;
  }

  set name(value: string | null) {
    this.props.name = value;
    this.touch();
  }

  get username(): string | null {
    return this.props.username;
  }

  set username(value: string | null) {
    this.props.username = value;
    this.touch();
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  set avatarUrl(value: string | null) {
    this.props.avatarUrl = value;
    this.touch();
  }

  get customerId(): UniqueEntityID | null {
    return this.props.customerId;
  }

  set customerId(value: UniqueEntityID | null) {
    this.props.customerId = value;
    this.touch();
  }

  get lastMessageAt(): Date | null {
    return this.props.lastMessageAt;
  }

  set lastMessageAt(value: Date | null) {
    this.props.lastMessageAt = value;
    this.touch();
  }

  get unreadCount(): number {
    return this.props.unreadCount;
  }

  set unreadCount(value: number) {
    this.props.unreadCount = value;
    this.touch();
  }

  get isBlocked(): boolean {
    return this.props.isBlocked;
  }

  set isBlocked(value: boolean) {
    this.props.isBlocked = value;
    this.touch();
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  set metadata(value: Record<string, unknown> | null) {
    this.props.metadata = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<
      MessagingContactProps,
      | 'name'
      | 'username'
      | 'avatarUrl'
      | 'customerId'
      | 'lastMessageAt'
      | 'unreadCount'
      | 'isBlocked'
      | 'metadata'
      | 'createdAt'
      | 'updatedAt'
    > & {
      name?: string | null;
      username?: string | null;
      avatarUrl?: string | null;
      customerId?: UniqueEntityID | null;
      lastMessageAt?: Date | null;
      unreadCount?: number;
      isBlocked?: boolean;
      metadata?: Record<string, unknown> | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): MessagingContact {
    return new MessagingContact(
      {
        ...props,
        name: props.name ?? null,
        username: props.username ?? null,
        avatarUrl: props.avatarUrl ?? null,
        customerId: props.customerId ?? null,
        lastMessageAt: props.lastMessageAt ?? null,
        unreadCount: props.unreadCount ?? 0,
        isBlocked: props.isBlocked ?? false,
        metadata: props.metadata ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
