import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface EmailMessageProps {
  tenantId: UniqueEntityID;
  accountId: UniqueEntityID;
  folderId: UniqueEntityID;
  remoteUid: number;
  messageId: string | null;
  threadId: string | null;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  subject: string;
  snippet: string | null;
  bodyText: string | null;
  bodyHtmlSanitized: string | null;
  receivedAt: Date;
  sentAt: Date | null;
  isRead: boolean;
  isFlagged: boolean;
  hasAttachments: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EmailMessage extends Entity<EmailMessageProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get accountId(): UniqueEntityID {
    return this.props.accountId;
  }

  get folderId(): UniqueEntityID {
    return this.props.folderId;
  }

  set folderId(value: UniqueEntityID) {
    this.props.folderId = value;
    this.touch();
  }

  get remoteUid(): number {
    return this.props.remoteUid;
  }

  get messageId(): string | null {
    return this.props.messageId;
  }

  get threadId(): string | null {
    return this.props.threadId;
  }

  get fromAddress(): string {
    return this.props.fromAddress;
  }

  get fromName(): string | null {
    return this.props.fromName;
  }

  get toAddresses(): string[] {
    return this.props.toAddresses;
  }

  get ccAddresses(): string[] {
    return this.props.ccAddresses;
  }

  get bccAddresses(): string[] {
    return this.props.bccAddresses;
  }

  get subject(): string {
    return this.props.subject;
  }

  get snippet(): string | null {
    return this.props.snippet;
  }

  get bodyText(): string | null {
    return this.props.bodyText;
  }

  get bodyHtmlSanitized(): string | null {
    return this.props.bodyHtmlSanitized;
  }

  get receivedAt(): Date {
    return this.props.receivedAt;
  }

  get sentAt(): Date | null {
    return this.props.sentAt;
  }

  get isRead(): boolean {
    return this.props.isRead;
  }

  set isRead(value: boolean) {
    this.props.isRead = value;
    this.touch();
  }

  get isFlagged(): boolean {
    return this.props.isFlagged;
  }

  set isFlagged(value: boolean) {
    this.props.isFlagged = value;
    this.touch();
  }

  get hasAttachments(): boolean {
    return this.props.hasAttachments;
  }

  set hasAttachments(value: boolean) {
    this.props.hasAttachments = value;
    this.touch();
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  set deletedAt(value: Date | null) {
    this.props.deletedAt = value;
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
      EmailMessageProps,
      | 'messageId'
      | 'threadId'
      | 'fromName'
      | 'ccAddresses'
      | 'bccAddresses'
      | 'snippet'
      | 'bodyText'
      | 'bodyHtmlSanitized'
      | 'sentAt'
      | 'isRead'
      | 'isFlagged'
      | 'hasAttachments'
      | 'deletedAt'
      | 'createdAt'
      | 'updatedAt'
    > & {
      messageId?: string | null;
      threadId?: string | null;
      fromName?: string | null;
      ccAddresses?: string[];
      bccAddresses?: string[];
      snippet?: string | null;
      bodyText?: string | null;
      bodyHtmlSanitized?: string | null;
      sentAt?: Date | null;
      isRead?: boolean;
      isFlagged?: boolean;
      hasAttachments?: boolean;
      deletedAt?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EmailMessage {
    return new EmailMessage(
      {
        ...props,
        messageId: props.messageId ?? null,
        threadId: props.threadId ?? null,
        fromName: props.fromName ?? null,
        ccAddresses: props.ccAddresses ?? [],
        bccAddresses: props.bccAddresses ?? [],
        snippet: props.snippet ?? null,
        bodyText: props.bodyText ?? null,
        bodyHtmlSanitized: props.bodyHtmlSanitized ?? null,
        sentAt: props.sentAt ?? null,
        isRead: props.isRead ?? false,
        isFlagged: props.isFlagged ?? false,
        hasAttachments: props.hasAttachments ?? false,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
