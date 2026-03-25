import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type { OverdueEscalationStep } from './overdue-escalation-step';

export interface OverdueEscalationProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  steps: OverdueEscalationStep[];
  createdAt: Date;
  updatedAt?: Date;
}

export class OverdueEscalation extends Entity<OverdueEscalationProps> {
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

  get isDefault(): boolean {
    return this.props.isDefault;
  }
  set isDefault(value: boolean) {
    this.props.isDefault = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }
  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get steps(): OverdueEscalationStep[] {
    return this.props.steps;
  }
  set steps(value: OverdueEscalationStep[]) {
    this.props.steps = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  activate(): void {
    this.isActive = true;
  }
  deactivate(): void {
    this.isActive = false;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      OverdueEscalationProps,
      'id' | 'createdAt' | 'updatedAt' | 'isDefault' | 'isActive' | 'steps'
    >,
    id?: UniqueEntityID,
  ): OverdueEscalation {
    return new OverdueEscalation(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isDefault: props.isDefault ?? false,
        isActive: props.isActive ?? true,
        steps: props.steps ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
