import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type {
  EscalationActionStatus,
  EscalationChannel,
} from './overdue-escalation-types';

export interface OverdueActionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  entryId: UniqueEntityID;
  stepId?: UniqueEntityID;
  channel: EscalationChannel;
  status: EscalationActionStatus;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

export class OverdueAction extends Entity<OverdueActionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get entryId(): UniqueEntityID {
    return this.props.entryId;
  }
  get stepId(): UniqueEntityID | undefined {
    return this.props.stepId;
  }

  get channel(): EscalationChannel {
    return this.props.channel;
  }

  get status(): EscalationActionStatus {
    return this.props.status;
  }
  set status(value: EscalationActionStatus) {
    this.props.status = value;
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }
  set sentAt(value: Date | undefined) {
    this.props.sentAt = value;
  }

  get error(): string | undefined {
    return this.props.error;
  }
  set error(value: string | undefined) {
    this.props.error = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markAsSent(): void {
    this.props.status = 'SENT';
    this.props.sentAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.props.status = 'FAILED';
    this.props.error = errorMessage;
  }

  markAsSkipped(): void {
    this.props.status = 'SKIPPED';
  }

  static create(
    props: Optional<OverdueActionProps, 'id' | 'createdAt' | 'status'>,
    id?: UniqueEntityID,
  ): OverdueAction {
    return new OverdueAction(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
