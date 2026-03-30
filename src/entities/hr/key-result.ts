import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface KeyResultProps {
  tenantId: UniqueEntityID;
  objectiveId: UniqueEntityID;
  title: string;
  description?: string;
  type: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit?: string;
  status: string;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

export class KeyResult extends Entity<KeyResultProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get objectiveId(): UniqueEntityID {
    return this.props.objectiveId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get type(): string {
    return this.props.type;
  }

  get startValue(): number {
    return this.props.startValue;
  }

  get targetValue(): number {
    return this.props.targetValue;
  }

  get currentValue(): number {
    return this.props.currentValue;
  }

  get unit(): string | undefined {
    return this.props.unit;
  }

  get status(): string {
    return this.props.status;
  }

  get weight(): number {
    return this.props.weight;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get progressPercentage(): number {
    const range = this.props.targetValue - this.props.startValue;
    if (range === 0)
      return this.props.currentValue >= this.props.targetValue ? 100 : 0;
    const progress =
      ((this.props.currentValue - this.props.startValue) / range) * 100;
    return Math.min(100, Math.max(0, Number(progress.toFixed(2))));
  }

  updateCurrentValue(newValue: number): void {
    this.props.currentValue = newValue;
    this.recalculateStatus();
    this.props.updatedAt = new Date();
  }

  private recalculateStatus(): void {
    const progress = this.progressPercentage;
    if (progress >= 100) {
      this.props.status = 'COMPLETED';
    } else if (progress >= 70) {
      this.props.status = 'ON_TRACK';
    } else if (progress >= 40) {
      this.props.status = 'AT_RISK';
    } else {
      this.props.status = 'BEHIND';
    }
  }

  private constructor(props: KeyResultProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<KeyResultProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): KeyResult {
    const now = new Date();

    return new KeyResult(
      {
        ...props,
        startValue: props.startValue ?? 0,
        currentValue: props.currentValue ?? 0,
        status: props.status ?? 'ON_TRACK',
        weight: props.weight ?? 1,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
