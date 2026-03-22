import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface AnalyticsGoalProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  startDate: Date;
  endDate: Date;
  scope: string;
  userId?: string;
  teamId?: string;
  status: string;
  achievedAt?: Date;
  createdByUserId: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class AnalyticsGoal extends Entity<AnalyticsGoalProps> {
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

  get type(): string {
    return this.props.type;
  }

  get targetValue(): number {
    return this.props.targetValue;
  }

  set targetValue(value: number) {
    this.props.targetValue = value;
    this.touch();
  }

  get currentValue(): number {
    return this.props.currentValue;
  }

  set currentValue(value: number) {
    this.props.currentValue = value;
    if (value >= this.props.targetValue && this.props.status === 'ACTIVE') {
      this.props.status = 'ACHIEVED';
      this.props.achievedAt = new Date();
    }
    this.touch();
  }

  get unit(): string {
    return this.props.unit;
  }

  get period(): string {
    return this.props.period;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }

  get scope(): string {
    return this.props.scope;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get teamId(): string | undefined {
    return this.props.teamId;
  }

  get status(): string {
    return this.props.status;
  }

  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get achievedAt(): Date | undefined {
    return this.props.achievedAt;
  }

  get createdByUserId(): string {
    return this.props.createdByUserId;
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

  get progressPercentage(): number {
    if (this.props.targetValue === 0) return 0;
    return Math.min(
      100,
      (this.props.currentValue / this.props.targetValue) * 100,
    );
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.status = 'ARCHIVED';
    this.touch();
  }

  static create(
    props: Optional<
      AnalyticsGoalProps,
      'id' | 'currentValue' | 'status' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): AnalyticsGoal {
    return new AnalyticsGoal(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        currentValue: props.currentValue ?? 0,
        status: props.status ?? 'ACTIVE',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
