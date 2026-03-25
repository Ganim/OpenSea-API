import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MessagingChannel } from './messaging-channel.enum';
import type { MessagingDirection } from './messaging-direction.enum';
import type { MessagingMessageStatus } from './messaging-message-status.enum';
import type { MessagingMessageType } from './messaging-message-type.enum';

export interface MessagingMessageProps {
  tenantId: UniqueEntityID;
  accountId: UniqueEntityID;
  contactId: UniqueEntityID;
  channel: MessagingChannel;
  direction: MessagingDirection;
  type: MessagingMessageType;
  status: MessagingMessageStatus;
  text: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  fileName: string | null;
  templateName: string | null;
  templateParams: Record<string, string> | null;
  externalId: string | null;
  replyToMessageId: UniqueEntityID | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
}

export class MessagingMessage extends Entity<MessagingMessageProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get accountId(): UniqueEntityID {
    return this.props.accountId;
  }

  get contactId(): UniqueEntityID {
    return this.props.contactId;
  }

  get channel(): MessagingChannel {
    return this.props.channel;
  }

  get direction(): MessagingDirection {
    return this.props.direction;
  }

  get type(): MessagingMessageType {
    return this.props.type;
  }

  get status(): MessagingMessageStatus {
    return this.props.status;
  }

  set status(value: MessagingMessageStatus) {
    this.props.status = value;
  }

  get text(): string | null {
    return this.props.text;
  }

  get mediaUrl(): string | null {
    return this.props.mediaUrl;
  }

  get mediaType(): string | null {
    return this.props.mediaType;
  }

  get fileName(): string | null {
    return this.props.fileName;
  }

  get templateName(): string | null {
    return this.props.templateName;
  }

  get templateParams(): Record<string, string> | null {
    return this.props.templateParams;
  }

  get externalId(): string | null {
    return this.props.externalId;
  }

  set externalId(value: string | null) {
    this.props.externalId = value;
  }

  get replyToMessageId(): UniqueEntityID | null {
    return this.props.replyToMessageId;
  }

  get errorCode(): string | null {
    return this.props.errorCode;
  }

  set errorCode(value: string | null) {
    this.props.errorCode = value;
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  set errorMessage(value: string | null) {
    this.props.errorMessage = value;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get sentAt(): Date | null {
    return this.props.sentAt;
  }

  set sentAt(value: Date | null) {
    this.props.sentAt = value;
  }

  get deliveredAt(): Date | null {
    return this.props.deliveredAt;
  }

  set deliveredAt(value: Date | null) {
    this.props.deliveredAt = value;
  }

  get readAt(): Date | null {
    return this.props.readAt;
  }

  set readAt(value: Date | null) {
    this.props.readAt = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Omit<
      MessagingMessageProps,
      | 'status'
      | 'text'
      | 'mediaUrl'
      | 'mediaType'
      | 'fileName'
      | 'templateName'
      | 'templateParams'
      | 'externalId'
      | 'replyToMessageId'
      | 'errorCode'
      | 'errorMessage'
      | 'metadata'
      | 'sentAt'
      | 'deliveredAt'
      | 'readAt'
      | 'createdAt'
    > & {
      status?: MessagingMessageStatus;
      text?: string | null;
      mediaUrl?: string | null;
      mediaType?: string | null;
      fileName?: string | null;
      templateName?: string | null;
      templateParams?: Record<string, string> | null;
      externalId?: string | null;
      replyToMessageId?: UniqueEntityID | null;
      errorCode?: string | null;
      errorMessage?: string | null;
      metadata?: Record<string, unknown> | null;
      sentAt?: Date | null;
      deliveredAt?: Date | null;
      readAt?: Date | null;
      createdAt?: Date;
    },
    id?: UniqueEntityID,
  ): MessagingMessage {
    return new MessagingMessage(
      {
        ...props,
        status: props.status ?? 'PENDING',
        text: props.text ?? null,
        mediaUrl: props.mediaUrl ?? null,
        mediaType: props.mediaType ?? null,
        fileName: props.fileName ?? null,
        templateName: props.templateName ?? null,
        templateParams: props.templateParams ?? null,
        externalId: props.externalId ?? null,
        replyToMessageId: props.replyToMessageId ?? null,
        errorCode: props.errorCode ?? null,
        errorMessage: props.errorMessage ?? null,
        metadata: props.metadata ?? null,
        sentAt: props.sentAt ?? null,
        deliveredAt: props.deliveredAt ?? null,
        readAt: props.readAt ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
