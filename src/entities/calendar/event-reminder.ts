import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface EventReminderProps {
  tenantId: UniqueEntityID;
  eventId: UniqueEntityID;
  userId: UniqueEntityID;
  minutesBefore: number;
  isSent: boolean;
  sentAt?: Date | null;
  createdAt: Date;
}

export class EventReminder extends Entity<EventReminderProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get eventId(): UniqueEntityID {
    return this.props.eventId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get minutesBefore(): number {
    return this.props.minutesBefore;
  }

  get isSent(): boolean {
    return this.props.isSent;
  }

  get sentAt(): Date | null {
    return this.props.sentAt ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markSent(): void {
    this.props.isSent = true;
    this.props.sentAt = new Date();
  }

  static create(
    props: Omit<EventReminderProps, 'createdAt' | 'isSent'> & {
      createdAt?: Date;
      isSent?: boolean;
    },
    id?: UniqueEntityID,
  ): EventReminder {
    return new EventReminder(
      {
        ...props,
        isSent: props.isSent ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
