import { Entity } from '../domain/entities';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PayrollItem } from './payroll-item';
import { PayrollStatus } from './value-objects';

export interface PayrollProps {
  tenantId: UniqueEntityID;
  referenceMonth: number; // 1-12
  referenceYear: number;
  status: PayrollStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  processedAt?: Date;
  processedBy?: UniqueEntityID;
  approvedAt?: Date;
  approvedBy?: UniqueEntityID;
  paidAt?: Date;
  paidBy?: UniqueEntityID;
  items?: PayrollItem[];
  createdAt: Date;
  updatedAt: Date;
}

export class Payroll extends Entity<PayrollProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get referenceMonth(): number {
    return this.props.referenceMonth;
  }

  get referenceYear(): number {
    return this.props.referenceYear;
  }

  get status(): PayrollStatus {
    return this.props.status;
  }

  get totalGross(): number {
    return this.props.totalGross;
  }

  get totalDeductions(): number {
    return this.props.totalDeductions;
  }

  get totalNet(): number {
    return this.props.totalNet;
  }

  get processedAt(): Date | undefined {
    return this.props.processedAt;
  }

  get processedBy(): UniqueEntityID | undefined {
    return this.props.processedBy;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy;
  }

  get paidAt(): Date | undefined {
    return this.props.paidAt;
  }

  get paidBy(): UniqueEntityID | undefined {
    return this.props.paidBy;
  }

  get items(): PayrollItem[] {
    return this.props.items ?? [];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Reference period as string (YYYY-MM)
   */
  get referencePeriod(): string {
    return `${this.referenceYear}-${String(this.referenceMonth).padStart(2, '0')}`;
  }

  /**
   * Number of employees in this payroll
   */
  get employeeCount(): number {
    const uniqueEmployees = new Set(
      this.items.map((item) => item.employeeId.toString()),
    );
    return uniqueEmployees.size;
  }

  // Status check methods
  isDraft(): boolean {
    return this.status.isDraft();
  }

  isProcessing(): boolean {
    return this.status.isProcessing();
  }

  isCalculated(): boolean {
    return this.status.isCalculated();
  }

  isApproved(): boolean {
    return this.status.isApproved();
  }

  isPaid(): boolean {
    return this.status.isPaid();
  }

  isCancelled(): boolean {
    return this.status.isCancelled();
  }

  canBeEdited(): boolean {
    return this.status.canBeEdited();
  }

  // Business methods
  startProcessing(processedBy: UniqueEntityID): void {
    if (!this.status.canBeProcessed()) {
      throw new Error('Payroll cannot be processed in current status');
    }

    this.props.status = PayrollStatus.PROCESSING();
    this.props.processedBy = processedBy;
    this.props.processedAt = new Date();
    this.props.updatedAt = new Date();
  }

  finishCalculation(totalGross?: number, totalDeductions?: number): void {
    if (!this.status.isProcessing()) {
      throw new Error('Payroll must be processing to finish calculation');
    }

    // Update totals if provided
    if (totalGross !== undefined && totalDeductions !== undefined) {
      this.props.totalGross = totalGross;
      this.props.totalDeductions = totalDeductions;
      this.props.totalNet = totalGross - totalDeductions;
    }

    this.props.status = PayrollStatus.CALCULATED();
    this.props.updatedAt = new Date();
  }

  approve(approvedBy: UniqueEntityID): void {
    if (!this.status.canBeApproved()) {
      throw new Error('Payroll cannot be approved in current status');
    }

    this.props.status = PayrollStatus.APPROVED();
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markAsPaid(paidBy: UniqueEntityID): void {
    if (!this.status.canBePaid()) {
      throw new Error('Payroll cannot be paid in current status');
    }

    this.props.status = PayrollStatus.PAID();
    this.props.paidBy = paidBy;
    this.props.paidAt = new Date();
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new Error('Payroll cannot be cancelled in current status');
    }

    this.props.status = PayrollStatus.CANCELLED();
    this.props.updatedAt = new Date();
  }

  updateTotals(totalGross: number, totalDeductions: number): void {
    if (!this.canBeEdited()) {
      throw new Error('Payroll cannot be edited in current status');
    }

    this.props.totalGross = totalGross;
    this.props.totalDeductions = totalDeductions;
    this.props.totalNet = totalGross - totalDeductions;
    this.props.updatedAt = new Date();
  }

  addItem(item: PayrollItem): void {
    if (!this.canBeEdited()) {
      throw new Error('Cannot add items to payroll in current status');
    }

    if (!this.props.items) {
      this.props.items = [];
    }

    this.props.items.push(item);
    this.recalculateTotals();
  }

  removeItem(itemId: UniqueEntityID): void {
    if (!this.canBeEdited()) {
      throw new Error('Cannot remove items from payroll in current status');
    }

    if (this.props.items) {
      this.props.items = this.props.items.filter(
        (item) => !item.id.equals(itemId),
      );
      this.recalculateTotals();
    }
  }

  private recalculateTotals(): void {
    let totalGross = 0;
    let totalDeductions = 0;

    for (const item of this.items) {
      if (item.isDeduction) {
        totalDeductions += item.amount;
      } else {
        totalGross += item.amount;
      }
    }

    this.props.totalGross = totalGross;
    this.props.totalDeductions = totalDeductions;
    this.props.totalNet = totalGross - totalDeductions;
    this.props.updatedAt = new Date();
  }

  /**
   * Get all items for a specific employee
   */
  getItemsByEmployee(employeeId: UniqueEntityID): PayrollItem[] {
    return this.items.filter((item) => item.employeeId.equals(employeeId));
  }

  /**
   * Get employee's net salary
   */
  getEmployeeNetSalary(employeeId: UniqueEntityID): number {
    const employeeItems = this.getItemsByEmployee(employeeId);
    let gross = 0;
    let deductions = 0;

    for (const item of employeeItems) {
      if (item.isDeduction) {
        deductions += item.amount;
      } else {
        gross += item.amount;
      }
    }

    return gross - deductions;
  }

  private constructor(props: PayrollProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: Omit<
      PayrollProps,
      'createdAt' | 'updatedAt' | 'totalNet' | 'status'
    > & {
      status?: PayrollStatus;
    },
    id?: UniqueEntityID,
  ): Payroll {
    const now = new Date();

    // Validate month
    if (props.referenceMonth < 1 || props.referenceMonth > 12) {
      throw new Error('Reference month must be between 1 and 12');
    }

    // Validate year
    if (props.referenceYear < 2000 || props.referenceYear > 2100) {
      throw new Error('Reference year must be between 2000 and 2100');
    }

    const totalNet = props.totalGross - props.totalDeductions;

    return new Payroll(
      {
        ...props,
        status: props.status ?? PayrollStatus.DRAFT(),
        totalNet,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );
  }
}
