import { Entity } from '@/entities/domain/entities';
import { Optional } from '@/entities/domain/optional';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export type NotificationTypeValue =
  | 'INFO'
  | 'WARNING'
  | 'ERROR'
  | 'SUCCESS'
  | 'REMINDER';
export type NotificationPriorityValue = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NotificationChannelValue = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface NotificationProps {
  id: UniqueEntityID;
  userId: UniqueEntityID;
  title: string;
  message: string;
  type: NotificationTypeValue;
  priority: NotificationPriorityValue;
  channel: NotificationChannelValue;
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  isSent: boolean;
  scheduledFor?: Date;
  readAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Notification extends Entity<NotificationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get userId(): UniqueEntityID {
    return this.props.userId;
  }
  get title(): string {
    return this.props.title;
  }
  get message(): string {
    return this.props.message;
  }
  get type(): NotificationTypeValue {
    return this.props.type;
  }
  get priority(): NotificationPriorityValue {
    return this.props.priority;
  }
  get channel(): NotificationChannelValue {
    return this.props.channel;
  }
  get actionUrl(): string | undefined {
    return this.props.actionUrl;
  }
  get actionText(): string | undefined {
    return this.props.actionText;
  }
  get entityType(): string | undefined {
    return this.props.entityType;
  }
  get entityId(): string | undefined {
    return this.props.entityId;
  }
  get isRead(): boolean {
    return this.props.isRead;
  }
  get isSent(): boolean {
    return this.props.isSent;
  }
  get scheduledFor(): Date | undefined {
    return this.props.scheduledFor;
  }
  get readAt(): Date | undefined {
    return this.props.readAt;
  }
  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  markRead() {
    if (!this.props.isRead) {
      this.props.isRead = true;
      this.props.readAt = new Date();
      this.touch();
    }
  }

  markSent() {
    if (!this.props.isSent) {
      this.props.isSent = true;
      this.props.sentAt = new Date();
      this.touch();
    }
  }

  schedule(date: Date) {
    this.props.scheduledFor = date;
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }

  static create(
    props: Optional<
      NotificationProps,
      'id' | 'isRead' | 'isSent' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): Notification {
    const entity = new Notification(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isRead: props.isRead ?? false,
        isSent: props.isSent ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return entity;
  }
}
