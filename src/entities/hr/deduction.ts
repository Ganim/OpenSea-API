import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface DeductionProps {
  employeeId: UniqueEntityID;
  name: string;
  amount: number;
  reason: string;
  date: Date;
  isRecurring: boolean;
  installments?: number; // Total number of installments (if parcelado)
  currentInstallment?: number; // Current installment number
  isApplied: boolean;
  appliedAt?: Date;
  payrollId?: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class Deduction extends Entity<DeductionProps> {
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

  get isRecurring(): boolean {
    return this.props.isRecurring;
  }

  get installments(): number | undefined {
    return this.props.installments;
  }

  get currentInstallment(): number | undefined {
    return this.props.currentInstallment;
  }

  get isApplied(): boolean {
    return this.props.isApplied;
  }

  get appliedAt(): Date | undefined {
    return this.props.appliedAt;
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
    return !this.isApplied;
  }

  isLinkedToPayroll(): boolean {
    return !!this.payrollId;
  }

  isInstallmentBased(): boolean {
    return !!this.installments && this.installments > 1;
  }

  hasRemainingInstallments(): boolean {
    if (!this.isInstallmentBased()) {
      return false;
    }

    return (this.currentInstallment ?? 0) < (this.installments ?? 0);
  }

  getRemainingInstallments(): number {
    if (!this.isInstallmentBased()) {
      return 0;
    }

    return (this.installments ?? 0) - (this.currentInstallment ?? 0);
  }

  getInstallmentAmount(): number {
    if (!this.isInstallmentBased()) {
      return this.amount;
    }

    return this.amount / (this.installments ?? 1);
  }

  markAsApplied(payrollId?: UniqueEntityID): void {
    if (
      this.isApplied &&
      !this.isRecurring &&
      !this.hasRemainingInstallments()
    ) {
      throw new Error('Deduction is already fully applied');
    }

    this.props.isApplied = true;
    this.props.appliedAt = new Date();

    if (payrollId) {
      this.props.payrollId = payrollId;
    }

    // Advance installment counter if applicable
    if (this.isInstallmentBased()) {
      this.props.currentInstallment = (this.props.currentInstallment ?? 0) + 1;

      // Check if all installments are complete
      if (!this.hasRemainingInstallments()) {
        this.props.isApplied = true;
      }
    }

    this.props.updatedAt = new Date();
  }

  updateAmount(amount: number): void {
    if (this.isApplied && !this.isRecurring) {
      throw new Error(
        'Cannot update amount of applied non-recurring deduction',
      );
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    this.props.amount = amount;
    this.props.updatedAt = new Date();
  }

  updateReason(reason: string): void {
    if (this.isApplied && !this.isRecurring) {
      throw new Error(
        'Cannot update reason of applied non-recurring deduction',
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required');
    }

    this.props.reason = reason.trim();
    this.props.updatedAt = new Date();
  }

  private constructor(props: DeductionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<DeductionProps, 'createdAt' | 'updatedAt' | 'isApplied'> & {
      isApplied?: boolean;
    },
    id?: UniqueEntityID,
  ): Deduction {
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

    if (props.installments && props.installments < 1) {
      throw new Error('Installments must be at least 1');
    }

    return new Deduction(
      {
        ...props,
        name: props.name.trim(),
        reason: props.reason.trim(),
        isApplied: props.isApplied ?? false,
        currentInstallment: props.currentInstallment ?? 0,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
