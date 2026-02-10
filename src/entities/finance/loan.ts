import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface LoanProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bankAccountId: UniqueEntityID;
  costCenterId: UniqueEntityID;
  name: string;
  type: string; // PERSONAL | BUSINESS | WORKING_CAPITAL | EQUIPMENT | REAL_ESTATE | CREDIT_LINE | OTHER
  contractNumber?: string;
  status: string; // ACTIVE | PAID_OFF | DEFAULTED | RENEGOTIATED | CANCELLED
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  interestType?: string;
  startDate: Date;
  endDate?: Date;
  totalInstallments: number;
  paidInstallments: number;
  installmentDay?: number;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Loan extends Entity<LoanProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get bankAccountId(): UniqueEntityID {
    return this.props.bankAccountId;
  }
  set bankAccountId(value: UniqueEntityID) {
    this.props.bankAccountId = value;
    this.touch();
  }

  get costCenterId(): UniqueEntityID {
    return this.props.costCenterId;
  }
  set costCenterId(value: UniqueEntityID) {
    this.props.costCenterId = value;
    this.touch();
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

  get contractNumber(): string | undefined {
    return this.props.contractNumber;
  }
  set contractNumber(value: string | undefined) {
    this.props.contractNumber = value;
    this.touch();
  }

  get status(): string {
    return this.props.status;
  }
  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get principalAmount(): number {
    return this.props.principalAmount;
  }

  get outstandingBalance(): number {
    return this.props.outstandingBalance;
  }
  set outstandingBalance(value: number) {
    this.props.outstandingBalance = value;
    this.touch();
  }

  get interestRate(): number {
    return this.props.interestRate;
  }
  set interestRate(value: number) {
    this.props.interestRate = value;
    this.touch();
  }

  get interestType(): string | undefined {
    return this.props.interestType;
  }
  set interestType(value: string | undefined) {
    this.props.interestType = value;
    this.touch();
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }
  set endDate(value: Date | undefined) {
    this.props.endDate = value;
    this.touch();
  }

  get totalInstallments(): number {
    return this.props.totalInstallments;
  }

  get paidInstallments(): number {
    return this.props.paidInstallments;
  }
  set paidInstallments(value: number) {
    this.props.paidInstallments = value;
    this.touch();
  }

  get installmentDay(): number | undefined {
    return this.props.installmentDay;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }
  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get metadata(): Record<string, unknown> {
    return this.props.metadata;
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

  // Computed getters
  get isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }
  get isDefaulted(): boolean {
    return this.props.status === 'DEFAULTED';
  }
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get progressPercentage(): number {
    if (this.props.totalInstallments === 0) return 0;
    return (this.props.paidInstallments / this.props.totalInstallments) * 100;
  }

  get remainingInstallments(): number {
    return this.props.totalInstallments - this.props.paidInstallments;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }
  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      LoanProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'status'
      | 'paidInstallments'
      | 'metadata'
    >,
    id?: UniqueEntityID,
  ): Loan {
    return new Loan(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'ACTIVE',
        paidInstallments: props.paidInstallments ?? 0,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
