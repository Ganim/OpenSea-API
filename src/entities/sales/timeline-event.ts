import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface TimelineEventProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  type: string;
  contactId?: UniqueEntityID;
  customerId?: UniqueEntityID;
  dealId?: UniqueEntityID;
  title: string;
  metadata: Record<string, unknown>;
  source: string;
  sourceModule?: string;
  createdAt: Date;
}

export class TimelineEvent extends Entity<TimelineEventProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): string {
    return this.props.type;
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

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  get source(): string {
    return this.props.source;
  }

  get sourceModule(): string | undefined {
    return this.props.sourceModule;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<TimelineEventProps, 'id' | 'createdAt' | 'metadata' | 'source'>,
    id?: UniqueEntityID,
  ): TimelineEvent {
    const event = new TimelineEvent(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        metadata: props.metadata ?? {},
        source: props.source ?? 'SYSTEM',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return event;
  }
}
