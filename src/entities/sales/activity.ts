import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ActivityProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  dealId?: UniqueEntityID;
  contactId?: UniqueEntityID;
  type: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  completedAt?: Date;
  duration?: number;
  userId: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Activity extends Entity<ActivityProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get dealId(): UniqueEntityID | undefined {
    return this.props.dealId;
  }

  set dealId(value: UniqueEntityID | undefined) {
    this.props.dealId = value;
    this.touch();
  }

  get contactId(): UniqueEntityID | undefined {
    return this.props.contactId;
  }

  set contactId(value: UniqueEntityID | undefined) {
    this.props.contactId = value;
    this.touch();
  }

  get type(): string {
    return this.props.type;
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

  get status(): string {
    return this.props.status;
  }

  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  set dueDate(value: Date | undefined) {
    this.props.dueDate = value;
    this.touch();
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get duration(): number | undefined {
    return this.props.duration;
  }

  set duration(value: number | undefined) {
    this.props.duration = value;
    this.touch();
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
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

  complete(): void {
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.touch();
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.touch();
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
    props: Optional<
      ActivityProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): Activity {
    return new Activity(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'PLANNED',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
