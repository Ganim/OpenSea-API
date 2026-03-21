import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export const ACTIVITY_TYPES = [
  'NOTE',
  'CALL',
  'MEETING',
  'TASK',
  'EMAIL_SENT',
  'EMAIL_RECEIVED',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface ActivityProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  type: ActivityType;
  contactId?: UniqueEntityID;
  customerId?: UniqueEntityID;
  dealId?: UniqueEntityID;
  title: string;
  description?: string;
  performedByUserId?: UniqueEntityID;
  performedAt: Date;
  dueAt?: Date;
  completedAt?: Date;
  duration?: number; // seconds
  outcome?: string;
  metadata?: Record<string, unknown>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Activity extends Entity<ActivityProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): ActivityType {
    return this.props.type;
  }

  set type(value: ActivityType) {
    this.props.type = value;
    this.touch();
  }

  get contactId(): UniqueEntityID | undefined {
    return this.props.contactId;
  }

  get customerId(): UniqueEntityID | undefined {
    return this.props.customerId;
  }

  get dealId(): UniqueEntityID | undefined {
    return this.props.dealId;
  }

  get title(): string {
    return this.props.title;
  }

  set title(value: string) {
    this.props.title = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get performedByUserId(): UniqueEntityID | undefined {
    return this.props.performedByUserId;
  }

  get performedAt(): Date {
    return this.props.performedAt;
  }

  set performedAt(value: Date) {
    this.props.performedAt = value;
    this.touch();
  }

  get dueAt(): Date | undefined {
    return this.props.dueAt;
  }

  set dueAt(value: Date | undefined) {
    this.props.dueAt = value;
    this.touch();
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  set completedAt(value: Date | undefined) {
    this.props.completedAt = value;
    this.touch();
  }

  get duration(): number | undefined {
    return this.props.duration;
  }

  set duration(value: number | undefined) {
    this.props.duration = value;
    this.touch();
  }

  get outcome(): string | undefined {
    return this.props.outcome;
  }

  set outcome(value: string | undefined) {
    this.props.outcome = value;
    this.touch();
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  set metadata(value: Record<string, unknown> | undefined) {
    this.props.metadata = value;
    this.touch();
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<ActivityProps, 'id' | 'createdAt' | 'performedAt'>,
    id?: UniqueEntityID,
  ): Activity {
    const activity = new Activity(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        performedAt: props.performedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return activity;
  }
}
