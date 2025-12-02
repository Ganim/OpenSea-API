import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PayrollItemType } from './value-objects';

export interface PayrollItemProps {
  payrollId: UniqueEntityID;
  employeeId: UniqueEntityID;
  type: PayrollItemType;
  description: string;
  amount: number;
  isDeduction: boolean;
  referenceId?: string; // ID of overtime, absence, etc
  referenceType?: string; // "overtime", "absence", etc
  createdAt: Date;
  updatedAt: Date;
}

export class PayrollItem extends Entity<PayrollItemProps> {
  get payrollId(): UniqueEntityID {
    return this.props.payrollId;
  }

  get employeeId(): UniqueEntityID {
    return this.props.employeeId;
  }

  get type(): PayrollItemType {
    return this.props.type;
  }

  get description(): string {
    return this.props.description;
  }

  get amount(): number {
    return this.props.amount;
  }

  get isDeduction(): boolean {
    return this.props.isDeduction;
  }

  get referenceId(): string | undefined {
    return this.props.referenceId;
  }

  get referenceType(): string | undefined {
    return this.props.referenceType;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business methods
  isEarning(): boolean {
    return !this.isDeduction;
  }

  isTax(): boolean {
    return this.type.isTax();
  }

  isBenefit(): boolean {
    return this.type.isBenefit();
  }

  isBonus(): boolean {
    return this.type.isBonus();
  }

  hasReference(): boolean {
    return !!this.referenceId && !!this.referenceType;
  }

  /**
   * Get the signed amount (negative for deductions)
   */
  get signedAmount(): number {
    return this.isDeduction ? -this.amount : this.amount;
  }

  updateAmount(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    this.props.amount = amount;
    this.props.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Description is required');
    }

    this.props.description = description.trim();
    this.props.updatedAt = new Date();
  }

  private constructor(props: PayrollItemProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<PayrollItemProps, 'createdAt' | 'updatedAt' | 'isDeduction'> & {
      isDeduction?: boolean;
    },
    id?: UniqueEntityID,
  ): PayrollItem {
    const now = new Date();

    if (props.amount < 0) {
      throw new Error('Amount must be positive');
    }

    if (!props.description || props.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    // Auto-detect if it's a deduction based on type
    const isDeduction = props.isDeduction ?? props.type.isDeduction();

    return new PayrollItem(
      {
        ...props,
        description: props.description.trim(),
        isDeduction,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
