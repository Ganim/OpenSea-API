import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type CadenceStepType =
  | 'EMAIL'
  | 'CALL'
  | 'TASK'
  | 'LINKEDIN'
  | 'WHATSAPP'
  | 'WAIT';

export type CadenceEnrollmentStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'BOUNCED';

export interface CadenceStepProps {
  id: UniqueEntityID;
  sequenceId: UniqueEntityID;
  order: number;
  type: CadenceStepType;
  delayDays: number;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CadenceEnrollmentProps {
  id: UniqueEntityID;
  sequenceId: UniqueEntityID;
  tenantId: UniqueEntityID;
  contactId?: string;
  dealId?: string;
  currentStepOrder: number;
  status: CadenceEnrollmentStatus;
  nextActionAt?: Date;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface CadenceSequenceProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  steps: CadenceStepProps[];
  enrollments?: CadenceEnrollmentProps[];
  enrollmentCount?: number;
}

export class CadenceSequence extends Entity<CadenceSequenceProps> {
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

  get description(): string | undefined {
    return this.props.description;
  }

  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get createdBy(): string {
    return this.props.createdBy;
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

  get steps(): CadenceStepProps[] {
    return this.props.steps;
  }

  set steps(value: CadenceStepProps[]) {
    this.props.steps = value;
    this.touch();
  }

  get enrollments(): CadenceEnrollmentProps[] | undefined {
    return this.props.enrollments;
  }

  get enrollmentCount(): number | undefined {
    return this.props.enrollmentCount;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.props.isActive = true;
    this.touch();
  }

  activate() {
    this.props.isActive = true;
    this.touch();
  }

  deactivate() {
    this.props.isActive = false;
    this.touch();
  }

  static create(
    props: Optional<
      CadenceSequenceProps,
      'id' | 'isActive' | 'createdAt' | 'steps'
    >,
    id?: UniqueEntityID,
  ): CadenceSequence {
    const cadenceSequence = new CadenceSequence(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? false,
        createdAt: props.createdAt ?? new Date(),
        steps: props.steps ?? [],
      },
      id,
    );

    return cadenceSequence;
  }
}
