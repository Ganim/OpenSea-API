import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FinanceEntryProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  type: string; // PAYABLE | RECEIVABLE
  code: string;
  description: string;
  notes?: string;
  categoryId: UniqueEntityID;
  costCenterId: UniqueEntityID;
  bankAccountId?: UniqueEntityID;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  salesOrderId?: string;
  expectedAmount: number;
  actualAmount?: number;
  discount: number;
  interest: number;
  penalty: number;
  issueDate: Date;
  dueDate: Date;
  competenceDate?: Date;
  paymentDate?: Date;
  status: string; // PENDING | OVERDUE | PAID | RECEIVED | PARTIALLY_PAID | CANCELLED | SCHEDULED
  recurrenceType: string; // SINGLE | RECURRING | INSTALLMENT
  recurrenceInterval?: number;
  recurrenceUnit?: string; // DAILY | WEEKLY | BIWEEKLY | MONTHLY | QUARTERLY | SEMIANNUAL | ANNUAL
  totalInstallments?: number;
  currentInstallment?: number;
  parentEntryId?: UniqueEntityID;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class FinanceEntry extends Entity<FinanceEntryProps> {
  get id(): UniqueEntityID { return this.props.id; }
  get tenantId(): UniqueEntityID { return this.props.tenantId; }

  get type(): string { return this.props.type; }

  get code(): string { return this.props.code; }
  set code(value: string) { this.props.code = value; this.touch(); }

  get description(): string { return this.props.description; }
  set description(value: string) { this.props.description = value; this.touch(); }

  get notes(): string | undefined { return this.props.notes; }
  set notes(value: string | undefined) { this.props.notes = value; this.touch(); }

  get categoryId(): UniqueEntityID { return this.props.categoryId; }
  set categoryId(value: UniqueEntityID) { this.props.categoryId = value; this.touch(); }

  get costCenterId(): UniqueEntityID { return this.props.costCenterId; }
  set costCenterId(value: UniqueEntityID) { this.props.costCenterId = value; this.touch(); }

  get bankAccountId(): UniqueEntityID | undefined { return this.props.bankAccountId; }
  set bankAccountId(value: UniqueEntityID | undefined) { this.props.bankAccountId = value; this.touch(); }

  get supplierName(): string | undefined { return this.props.supplierName; }
  set supplierName(value: string | undefined) { this.props.supplierName = value; this.touch(); }

  get customerName(): string | undefined { return this.props.customerName; }
  set customerName(value: string | undefined) { this.props.customerName = value; this.touch(); }

  get supplierId(): string | undefined { return this.props.supplierId; }
  set supplierId(value: string | undefined) { this.props.supplierId = value; this.touch(); }

  get customerId(): string | undefined { return this.props.customerId; }
  set customerId(value: string | undefined) { this.props.customerId = value; this.touch(); }

  get salesOrderId(): string | undefined { return this.props.salesOrderId; }
  set salesOrderId(value: string | undefined) { this.props.salesOrderId = value; this.touch(); }

  get expectedAmount(): number { return this.props.expectedAmount; }
  set expectedAmount(value: number) { this.props.expectedAmount = value; this.touch(); }

  get actualAmount(): number | undefined { return this.props.actualAmount; }
  set actualAmount(value: number | undefined) { this.props.actualAmount = value; this.touch(); }

  get discount(): number { return this.props.discount; }
  set discount(value: number) { this.props.discount = value; this.touch(); }

  get interest(): number { return this.props.interest; }
  set interest(value: number) { this.props.interest = value; this.touch(); }

  get penalty(): number { return this.props.penalty; }
  set penalty(value: number) { this.props.penalty = value; this.touch(); }

  get issueDate(): Date { return this.props.issueDate; }
  set issueDate(value: Date) { this.props.issueDate = value; this.touch(); }

  get dueDate(): Date { return this.props.dueDate; }
  set dueDate(value: Date) { this.props.dueDate = value; this.touch(); }

  get competenceDate(): Date | undefined { return this.props.competenceDate; }
  set competenceDate(value: Date | undefined) { this.props.competenceDate = value; this.touch(); }

  get paymentDate(): Date | undefined { return this.props.paymentDate; }
  set paymentDate(value: Date | undefined) { this.props.paymentDate = value; this.touch(); }

  get status(): string { return this.props.status; }
  set status(value: string) { this.props.status = value; this.touch(); }

  get recurrenceType(): string { return this.props.recurrenceType; }
  get recurrenceInterval(): number | undefined { return this.props.recurrenceInterval; }
  get recurrenceUnit(): string | undefined { return this.props.recurrenceUnit; }
  get totalInstallments(): number | undefined { return this.props.totalInstallments; }
  get currentInstallment(): number | undefined { return this.props.currentInstallment; }
  get parentEntryId(): UniqueEntityID | undefined { return this.props.parentEntryId; }

  get boletoBarcode(): string | undefined { return this.props.boletoBarcode; }
  set boletoBarcode(value: string | undefined) { this.props.boletoBarcode = value; this.touch(); }

  get boletoDigitLine(): string | undefined { return this.props.boletoDigitLine; }
  set boletoDigitLine(value: string | undefined) { this.props.boletoDigitLine = value; this.touch(); }

  get metadata(): Record<string, unknown> { return this.props.metadata; }
  get tags(): string[] { return this.props.tags; }

  get createdBy(): string | undefined { return this.props.createdBy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }

  get isDeleted(): boolean { return !!this.props.deletedAt; }

  get isOverdue(): boolean {
    if (['PAID', 'RECEIVED', 'CANCELLED'].includes(this.props.status)) return false;
    return new Date() > this.props.dueDate;
  }

  get totalDue(): number {
    return this.props.expectedAmount - this.props.discount + this.props.interest + this.props.penalty;
  }

  get remainingBalance(): number {
    return this.totalDue - (this.props.actualAmount ?? 0);
  }

  get isPayable(): boolean { return this.props.type === 'PAYABLE'; }
  get isReceivable(): boolean { return this.props.type === 'RECEIVABLE'; }

  markAsPaid(amount: number, paymentDate: Date): void {
    this.props.actualAmount = (this.props.actualAmount ?? 0) + amount;
    this.props.paymentDate = paymentDate;
    this.props.status = this.isPayable ? 'PAID' : 'RECEIVED';
    this.touch();
  }

  markAsPartiallyPaid(amount: number): void {
    this.props.actualAmount = (this.props.actualAmount ?? 0) + amount;
    this.props.status = 'PARTIALLY_PAID';
    this.touch();
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.touch();
  }

  markOverdue(): void {
    this.props.status = 'OVERDUE';
    this.touch();
  }

  delete(): void { this.props.deletedAt = new Date(); this.touch(); }
  restore(): void { this.props.deletedAt = undefined; this.touch(); }

  private touch(): void { this.props.updatedAt = new Date(); }

  static create(
    props: Optional<FinanceEntryProps, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'status' | 'discount' | 'interest' | 'penalty' | 'recurrenceType' | 'metadata' | 'tags'>,
    id?: UniqueEntityID,
  ): FinanceEntry {
    return new FinanceEntry({
      ...props,
      id: id ?? new UniqueEntityID(),
      status: props.status ?? 'PENDING',
      discount: props.discount ?? 0,
      interest: props.interest ?? 0,
      penalty: props.penalty ?? 0,
      recurrenceType: props.recurrenceType ?? 'SINGLE',
      metadata: props.metadata ?? {},
      tags: props.tags ?? [],
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt,
      deletedAt: props.deletedAt,
    }, id);
  }
}
