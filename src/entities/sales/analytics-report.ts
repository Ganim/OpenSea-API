import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface AnalyticsReportProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  type: string;
  config: Record<string, unknown>;
  format: string;
  dashboardId?: string;
  isScheduled: boolean;
  scheduleFrequency?: string;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  scheduleTimezone: string;
  deliveryMethod?: string;
  recipientUserIds: string[];
  recipientEmails: string[];
  recipientPhones: string[];
  lastGeneratedAt?: Date;
  lastFileId?: string;
  lastStatus?: string;
  lastError?: string;
  isActive: boolean;
  createdByUserId: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class AnalyticsReport extends Entity<AnalyticsReportProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get type(): string {
    return this.props.type;
  }

  get config(): Record<string, unknown> {
    return this.props.config;
  }

  get format(): string {
    return this.props.format;
  }

  get dashboardId(): string | undefined {
    return this.props.dashboardId;
  }

  get isScheduled(): boolean {
    return this.props.isScheduled;
  }

  get scheduleFrequency(): string | undefined {
    return this.props.scheduleFrequency;
  }

  get scheduleDayOfWeek(): number | undefined {
    return this.props.scheduleDayOfWeek;
  }

  get scheduleDayOfMonth(): number | undefined {
    return this.props.scheduleDayOfMonth;
  }

  get scheduleHour(): number | undefined {
    return this.props.scheduleHour;
  }

  get scheduleTimezone(): string {
    return this.props.scheduleTimezone;
  }

  get deliveryMethod(): string | undefined {
    return this.props.deliveryMethod;
  }

  get recipientUserIds(): string[] {
    return this.props.recipientUserIds;
  }

  get recipientEmails(): string[] {
    return this.props.recipientEmails;
  }

  get recipientPhones(): string[] {
    return this.props.recipientPhones;
  }

  get lastGeneratedAt(): Date | undefined {
    return this.props.lastGeneratedAt;
  }

  get lastStatus(): string | undefined {
    return this.props.lastStatus;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdByUserId(): string {
    return this.props.createdByUserId;
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  static create(
    props: Optional<AnalyticsReportProps, 'id' | 'isScheduled' | 'isActive' | 'scheduleTimezone' | 'recipientUserIds' | 'recipientEmails' | 'recipientPhones' | 'config' | 'createdAt'>,
    id?: UniqueEntityID,
  ): AnalyticsReport {
    return new AnalyticsReport(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isScheduled: props.isScheduled ?? false,
        isActive: props.isActive ?? true,
        scheduleTimezone: props.scheduleTimezone ?? 'America/Sao_Paulo',
        recipientUserIds: props.recipientUserIds ?? [],
        recipientEmails: props.recipientEmails ?? [],
        recipientPhones: props.recipientPhones ?? [],
        config: props.config ?? {},
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
