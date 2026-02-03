import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface BonusProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  name: string;
  amount: number;
  reason: string;
  date: Date;
  isPaid: boolean;
  paidAt?: Date;
  payrollId?: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class Bonus extends Entity<BonusProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get name(): string {
    return this.props.name;
  }

  get amount(): number {
    return this.props.amount;
  }

  get reason(): string {
    return this.props.reason;
  }

  get date(): Date {
    return this.props.date;
  }

  get isPaid(): boolean {
    return this.props.isPaid;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  get payrollId(): UniqueEntityID | undefined {
    return this.props.payrollId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isPending(): boolean {
    return !this.isPaid;
  }

  isLinkedToPayroll(): boolean {
    return !!this.payrollId;
  }

  markAsPaid(payrollId?: UniqueEntityID): void {
    if (this.isPaid) {
      throw new Error('Bonus is already paid');
    }

    this.props.isPaid = true;
    this.props.paidAt = new Date();
    if (payrollId) {
      this.props.payrollId = payrollId;
    }
    this.props.updatedAt = new Date();
  }

  updateAmount(amount: number): void {
    if (this.isPaid) {
      throw new Error('Cannot update amount of paid bonus');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    this.props.amount = amount;
    this.props.updatedAt = new Date();
  }

  updateReason(reason: string): void {
    if (this.isPaid) {
      throw new Error('Cannot update reason of paid bonus');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required');
    }

    this.props.reason = reason.trim();
    this.props.updatedAt = new Date();
  }

  private constructor(props: BonusProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<BonusProps, 'createdAt' | 'updatedAt' | 'isPaid'> & {
      isPaid?: boolean;
    },
    id?: UniqueEntityID,
  ): Bonus {
    const now = new Date();

    if (props.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!props.reason || props.reason.trim().length === 0) {
      throw new Error('Reason is required');
    }

    return new Bonus(
      {
        ...props,
        name: props.name.trim(),
        reason: props.reason.trim(),
        isPaid: props.isPaid ?? false,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
