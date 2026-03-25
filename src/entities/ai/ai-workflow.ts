import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface AiWorkflowAction {
  toolName: string;
  arguments: Record<string, unknown>;
  order: number;
}

export interface AiWorkflowCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: unknown;
}

export interface AiWorkflowProps {
  tenantId: UniqueEntityID;
  userId: UniqueEntityID;
  name: string;
  description: string;
  naturalPrompt: string;
  triggerType: 'MANUAL' | 'CRON' | 'EVENT';
  triggerConfig?: Record<string, unknown> | null;
  conditions?: AiWorkflowCondition[] | null;
  actions: AiWorkflowAction[];
  isActive: boolean;
  lastRunAt?: Date | null;
  runCount: number;
  lastError?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class AiWorkflow extends Entity<AiWorkflowProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  get description(): string {
    return this.props.description;
  }

  set description(description: string) {
    this.props.description = description;
    this.touch();
  }

  get naturalPrompt(): string {
    return this.props.naturalPrompt;
  }

  get triggerType(): 'MANUAL' | 'CRON' | 'EVENT' {
    return this.props.triggerType;
  }

  set triggerType(type: 'MANUAL' | 'CRON' | 'EVENT') {
    this.props.triggerType = type;
    this.touch();
  }

  get triggerConfig(): Record<string, unknown> | null {
    return this.props.triggerConfig ?? null;
  }

  set triggerConfig(config: Record<string, unknown> | null) {
    this.props.triggerConfig = config;
    this.touch();
  }

  get conditions(): AiWorkflowCondition[] | null {
    return this.props.conditions ?? null;
  }

  set conditions(conditions: AiWorkflowCondition[] | null) {
    this.props.conditions = conditions;
    this.touch();
  }

  get actions(): AiWorkflowAction[] {
    return this.props.actions;
  }

  set actions(actions: AiWorkflowAction[]) {
    this.props.actions = actions;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(active: boolean) {
    this.props.isActive = active;
    this.touch();
  }

  get lastRunAt(): Date | null {
    return this.props.lastRunAt ?? null;
  }

  get runCount(): number {
    return this.props.runCount;
  }

  get lastError(): string | null {
    return this.props.lastError ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt ?? null;
  }

  recordExecution(error?: string | null): void {
    this.props.lastRunAt = new Date();
    this.props.runCount += 1;
    this.props.lastError = error ?? null;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<AiWorkflowProps, 'createdAt' | 'isActive' | 'runCount'> & {
      createdAt?: Date;
      isActive?: boolean;
      runCount?: number;
    },
    id?: UniqueEntityID,
  ): AiWorkflow {
    return new AiWorkflow(
      {
        ...props,
        isActive: props.isActive ?? true,
        runCount: props.runCount ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
