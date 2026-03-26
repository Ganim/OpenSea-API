import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export enum EsocialBatchStatus {
  PENDING = 'PENDING',
  TRANSMITTING = 'TRANSMITTING',
  COMPLETED = 'COMPLETED',
  PARTIAL_ERROR = 'PARTIAL_ERROR',
  ERROR = 'ERROR',
}

export interface EsocialBatchProps {
  tenantId: UniqueEntityID;
  status: EsocialBatchStatus;
  eventCount: number;
  protocol?: string;
  transmittedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class EsocialBatch extends Entity<EsocialBatchProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get status(): EsocialBatchStatus {
    return this.props.status;
  }

  get eventCount(): number {
    return this.props.eventCount;
  }

  get protocol(): string | undefined {
    return this.props.protocol;
  }

  get transmittedAt(): Date | undefined {
    return this.props.transmittedAt;
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

  // Domain methods
  markTransmitting(): void {
    this.props.status = EsocialBatchStatus.TRANSMITTING;
    this.props.transmittedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markCompleted(protocol?: string): void {
    this.props.status = EsocialBatchStatus.COMPLETED;
    this.props.protocol = protocol;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markPartialError(protocol?: string): void {
    this.props.status = EsocialBatchStatus.PARTIAL_ERROR;
    this.props.protocol = protocol;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markError(): void {
    this.props.status = EsocialBatchStatus.ERROR;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private constructor(props: EsocialBatchProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<EsocialBatchProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EsocialBatch {
    const now = new Date();

    return new EsocialBatch(
      {
        ...props,
        status: props.status ?? EsocialBatchStatus.PENDING,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
