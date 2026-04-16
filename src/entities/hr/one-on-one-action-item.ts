import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface OneOnOneActionItemProps {
  meetingId: UniqueEntityID;
  ownerId: UniqueEntityID;
  content: string;
  isCompleted: boolean;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class OneOnOneActionItem extends Entity<OneOnOneActionItemProps> {
  get meetingId(): UniqueEntityID {
    return this.props.meetingId;
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  set ownerId(value: UniqueEntityID) {
    this.props.ownerId = value;
    this.touch();
  }

  get content(): string {
    return this.props.content;
  }

  set content(value: string) {
    this.props.content = value;
    this.touch();
  }

  get isCompleted(): boolean {
    return this.props.isCompleted;
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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markCompleted(): void {
    this.props.isCompleted = true;
    this.props.completedAt = new Date();
    this.touch();
  }

  markIncomplete(): void {
    this.props.isCompleted = false;
    this.props.completedAt = undefined;
    this.touch();
  }

  setCompleted(value: boolean): void {
    if (value) {
      this.markCompleted();
    } else {
      this.markIncomplete();
    }
  }

  isOwner(employeeId: UniqueEntityID): boolean {
    return this.ownerId.equals(employeeId);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private constructor(props: OneOnOneActionItemProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<OneOnOneActionItemProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): OneOnOneActionItem {
    const now = new Date();
    return new OneOnOneActionItem(
      {
        ...props,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
