import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface LeadScoringRuleProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  field: string;
  condition: string;
  value: string;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class LeadScoringRule extends Entity<LeadScoringRuleProps> {
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

  get field(): string {
    return this.props.field;
  }

  set field(value: string) {
    this.props.field = value;
    this.touch();
  }

  get condition(): string {
    return this.props.condition;
  }

  set condition(value: string) {
    this.props.condition = value;
    this.touch();
  }

  get value(): string {
    return this.props.value;
  }

  set value(val: string) {
    this.props.value = val;
    this.touch();
  }

  get points(): number {
    return this.props.points;
  }

  set points(val: number) {
    this.props.points = val;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(val: boolean) {
    this.props.isActive = val;
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
    props: Optional<LeadScoringRuleProps, 'id' | 'isActive' | 'createdAt'>,
    id?: UniqueEntityID,
  ): LeadScoringRule {
    return new LeadScoringRule(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
