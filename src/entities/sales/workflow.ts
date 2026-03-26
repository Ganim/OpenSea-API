import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type WorkflowTriggerType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'DEAL_WON'
  | 'DEAL_LOST'
  | 'CUSTOMER_CREATED'
  | 'QUOTE_SENT'
  | 'QUOTE_ACCEPTED';

export type WorkflowStepTypeValue =
  | 'SEND_EMAIL'
  | 'SEND_NOTIFICATION'
  | 'UPDATE_STATUS'
  | 'CREATE_TASK';

export interface WorkflowStepProps {
  id: UniqueEntityID;
  workflowId: UniqueEntityID;
  order: number;
  type: WorkflowStepTypeValue;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WorkflowProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  description?: string;
  trigger: WorkflowTriggerType;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  steps: WorkflowStepProps[];
}

export class Workflow extends Entity<WorkflowProps> {
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

  get trigger(): WorkflowTriggerType {
    return this.props.trigger;
  }

  set trigger(value: WorkflowTriggerType) {
    this.props.trigger = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get executionCount(): number {
    return this.props.executionCount;
  }

  get lastExecutedAt(): Date | undefined {
    return this.props.lastExecutedAt;
  }

  get steps(): WorkflowStepProps[] {
    return this.props.steps;
  }

  set steps(value: WorkflowStepProps[]) {
    this.props.steps = value;
    this.touch();
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  activate() {
    this.props.isActive = true;
    this.touch();
  }

  deactivate() {
    this.props.isActive = false;
    this.touch();
  }

  recordExecution() {
    this.props.executionCount += 1;
    this.props.lastExecutedAt = new Date();
    this.touch();
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

  static create(
    props: Optional<WorkflowProps, 'id' | 'isActive' | 'executionCount' | 'createdAt' | 'steps'>,
    id?: UniqueEntityID,
  ): Workflow {
    return new Workflow(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? false,
        executionCount: props.executionCount ?? 0,
        steps: props.steps ?? [],
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
