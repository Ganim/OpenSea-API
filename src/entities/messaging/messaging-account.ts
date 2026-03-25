import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MessagingAccountStatus } from './messaging-account-status.enum';
import type { MessagingChannel } from './messaging-channel.enum';

export interface MessagingAccountProps {
  tenantId: UniqueEntityID;
  channel: MessagingChannel;
  name: string;
  status: MessagingAccountStatus;
  phoneNumber: string | null;
  wabaId: string | null;
  igAccountId: string | null;
  tgBotToken: string | null;
  tgBotUsername: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MessagingAccount extends Entity<MessagingAccountProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get channel(): MessagingChannel {
    return this.props.channel;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get status(): MessagingAccountStatus {
    return this.props.status;
  }

  set status(value: MessagingAccountStatus) {
    this.props.status = value;
    this.touch();
  }

  get phoneNumber(): string | null {
    return this.props.phoneNumber;
  }

  set phoneNumber(value: string | null) {
    this.props.phoneNumber = value;
    this.touch();
  }

  get wabaId(): string | null {
    return this.props.wabaId;
  }

  set wabaId(value: string | null) {
    this.props.wabaId = value;
    this.touch();
  }

  get igAccountId(): string | null {
    return this.props.igAccountId;
  }

  set igAccountId(value: string | null) {
    this.props.igAccountId = value;
    this.touch();
  }

  get tgBotToken(): string | null {
    return this.props.tgBotToken;
  }

  set tgBotToken(value: string | null) {
    this.props.tgBotToken = value;
    this.touch();
  }

  get tgBotUsername(): string | null {
    return this.props.tgBotUsername;
  }

  set tgBotUsername(value: string | null) {
    this.props.tgBotUsername = value;
    this.touch();
  }

  get accessToken(): string | null {
    return this.props.accessToken;
  }

  set accessToken(value: string | null) {
    this.props.accessToken = value;
    this.touch();
  }

  get refreshToken(): string | null {
    return this.props.refreshToken;
  }

  set refreshToken(value: string | null) {
    this.props.refreshToken = value;
    this.touch();
  }

  get tokenExpiresAt(): Date | null {
    return this.props.tokenExpiresAt;
  }

  set tokenExpiresAt(value: Date | null) {
    this.props.tokenExpiresAt = value;
    this.touch();
  }

  get webhookUrl(): string | null {
    return this.props.webhookUrl;
  }

  set webhookUrl(value: string | null) {
    this.props.webhookUrl = value;
    this.touch();
  }

  get webhookSecret(): string | null {
    return this.props.webhookSecret;
  }

  set webhookSecret(value: string | null) {
    this.props.webhookSecret = value;
    this.touch();
  }

  get settings(): Record<string, unknown> | null {
    return this.props.settings;
  }

  set settings(value: Record<string, unknown> | null) {
    this.props.settings = value;
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
      MessagingAccountProps,
      | 'status'
      | 'phoneNumber'
      | 'wabaId'
      | 'igAccountId'
      | 'tgBotToken'
      | 'tgBotUsername'
      | 'accessToken'
      | 'refreshToken'
      | 'tokenExpiresAt'
      | 'webhookUrl'
      | 'webhookSecret'
      | 'settings'
      | 'createdAt'
      | 'updatedAt'
    > & {
      status?: MessagingAccountStatus;
      phoneNumber?: string | null;
      wabaId?: string | null;
      igAccountId?: string | null;
      tgBotToken?: string | null;
      tgBotUsername?: string | null;
      accessToken?: string | null;
      refreshToken?: string | null;
      tokenExpiresAt?: Date | null;
      webhookUrl?: string | null;
      webhookSecret?: string | null;
      settings?: Record<string, unknown> | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): MessagingAccount {
    return new MessagingAccount(
      {
        ...props,
        status: props.status ?? 'ACTIVE',
        phoneNumber: props.phoneNumber ?? null,
        wabaId: props.wabaId ?? null,
        igAccountId: props.igAccountId ?? null,
        tgBotToken: props.tgBotToken ?? null,
        tgBotUsername: props.tgBotUsername ?? null,
        accessToken: props.accessToken ?? null,
        refreshToken: props.refreshToken ?? null,
        tokenExpiresAt: props.tokenExpiresAt ?? null,
        webhookUrl: props.webhookUrl ?? null,
        webhookSecret: props.webhookSecret ?? null,
        settings: props.settings ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
