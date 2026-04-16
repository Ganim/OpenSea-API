import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type SalaryChangeReason =
  | 'ADMISSION'
  | 'ADJUSTMENT'
  | 'PROMOTION'
  | 'MERIT'
  | 'ROLE_CHANGE'
  | 'CORRECTION';

export interface SalaryHistoryProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  previousSalary?: number;
  newSalary: number;
  reason: SalaryChangeReason;
  notes?: string;
  effectiveDate: Date;
  changedBy: UniqueEntityID;
  createdAt: Date;
}

export class SalaryHistory extends Entity<SalaryHistoryProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get previousSalary(): number | undefined {
    return this.props.previousSalary;
  }

  get newSalary(): number {
    return this.props.newSalary;
  }

  get reason(): SalaryChangeReason {
    return this.props.reason;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get effectiveDate(): Date {
    return this.props.effectiveDate;
  }

  get changedBy(): UniqueEntityID {
    return this.props.changedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isEffectiveImmediately(referenceDate: Date = new Date()): boolean {
    return this.effectiveDate.getTime() <= referenceDate.getTime();
  }

  changeAmount(): number {
    if (this.previousSalary === undefined) {
      return this.newSalary;
    }
    return this.newSalary - this.previousSalary;
  }

  private constructor(props: SalaryHistoryProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<SalaryHistoryProps, 'createdAt'> & { createdAt?: Date },
    id?: UniqueEntityID,
  ): SalaryHistory {
    return new SalaryHistory(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
