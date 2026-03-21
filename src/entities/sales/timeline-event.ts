import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TimelineEventProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  dealId: UniqueEntityID;
  type: string;
  title: string;
  metadata?: Record<string, unknown>;
  userId?: UniqueEntityID;
  createdAt: Date;
}

export class TimelineEvent extends Entity<TimelineEventProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get dealId(): UniqueEntityID {
    return this.props.dealId;
  }

  get type(): string {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get userId(): UniqueEntityID | undefined {
    return this.props.userId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<TimelineEventProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): TimelineEvent {
    return new TimelineEvent(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
