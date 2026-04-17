import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Indicates whether the KR's target is reached by going UP from `startValue`
 * (e.g. "increase revenue from 0 to 100") or DOWN from `startValue`
 * (e.g. "reduce churn from 10% to 2%").
 *
 * NOTE: Not currently persisted in the `key_results` table — inferred from
 * the relative position of `startValue` vs `targetValue` when missing.
 */
export type KeyResultDirection = 'increase' | 'decrease';

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
  direction?: KeyResultDirection;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Infers the KR direction when not explicitly set:
 *   targetValue <  startValue → 'decrease'
 *   targetValue >= startValue → 'increase'
 */
export function inferKrDirection(
  startValue: number,
  targetValue: number,
): KeyResultDirection {
  return targetValue < startValue ? 'decrease' : 'increase';
}

export interface CalculateKrProgressInput {
  startValue: number;
  targetValue: number;
  currentValue: number;
  direction?: KeyResultDirection;
}

/**
 * Computes the 0..100 progress percentage of a Key Result.
 *
 * Guarantees:
 *  - NaN-safe: when `startValue === targetValue` (zero range) the function
 *    returns 100 when the target has been met, 0 otherwise — never NaN.
 *  - Direction-aware: 'decrease' KRs use `(start - current) / (start - target)`
 *    because progress grows as the current value DROPS toward the target.
 *  - Clamped to the `[0, 100]` interval and rounded to 2 decimals.
 */
export function calculateKrProgress({
  startValue,
  targetValue,
  currentValue,
  direction,
}: CalculateKrProgressInput): number {
  const resolvedDirection =
    direction ?? inferKrDirection(startValue, targetValue);

  if (startValue === targetValue) {
    if (resolvedDirection === 'decrease') {
      return currentValue <= targetValue ? 100 : 0;
    }
    return currentValue >= targetValue ? 100 : 0;
  }

  const rawProgress =
    resolvedDirection === 'decrease'
      ? ((startValue - currentValue) / (startValue - targetValue)) * 100
      : ((currentValue - startValue) / (targetValue - startValue)) * 100;

  const clampedProgress = Math.min(100, Math.max(0, rawProgress));

  return Number(clampedProgress.toFixed(2));
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

  get direction(): KeyResultDirection {
    return (
      this.props.direction ??
      inferKrDirection(this.props.startValue, this.props.targetValue)
    );
  }

  get progressPercentage(): number {
    return calculateKrProgress({
      startValue: this.props.startValue,
      targetValue: this.props.targetValue,
      currentValue: this.props.currentValue,
      direction: this.direction,
    });
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
