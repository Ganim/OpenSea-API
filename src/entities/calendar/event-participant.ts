import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface EventParticipantProps {
  tenantId: UniqueEntityID;
  eventId: UniqueEntityID;
  userId: UniqueEntityID;
  role: string;
  status: string;
  respondedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class EventParticipant extends Entity<EventParticipantProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get eventId(): UniqueEntityID {
    return this.props.eventId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get role(): string {
    return this.props.role;
  }

  set role(role: string) {
    this.props.role = role;
    this.touch();
  }

  get status(): string {
    return this.props.status;
  }

  set status(status: string) {
    this.props.status = status;
    this.touch();
  }

  get respondedAt(): Date | null {
    return this.props.respondedAt ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt ?? null;
  }

  respond(status: string): void {
    this.props.status = status;
    this.props.respondedAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<EventParticipantProps, 'createdAt' | 'role' | 'status'> & {
      createdAt?: Date;
      role?: string;
      status?: string;
    },
    id?: UniqueEntityID,
  ): EventParticipant {
    return new EventParticipant(
      {
        ...props,
        role: props.role ?? 'GUEST',
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
