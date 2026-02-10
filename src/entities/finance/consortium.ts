import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ConsortiumProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  bankAccountId: UniqueEntityID;
  costCenterId: UniqueEntityID;
  name: string;
  administrator: string;
  groupNumber?: string;
  quotaNumber?: string;
  contractNumber?: string;
  status: string; // ACTIVE | CONTEMPLATED | WITHDRAWN | COMPLETED | CANCELLED
  creditValue: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments: number;
  isContemplated: boolean;
  contemplatedAt?: Date;
  contemplationType?: string; // BID | DRAW
  startDate: Date;
  endDate?: Date;
  paymentDay?: number;
  notes?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Consortium extends Entity<ConsortiumProps> {
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

  get administrator(): string {
    return this.props.administrator;
  }
  set administrator(value: string) {
    this.props.administrator = value;
    this.touch();
  }

  get groupNumber(): string | undefined {
    return this.props.groupNumber;
  }
  set groupNumber(value: string | undefined) {
    this.props.groupNumber = value;
    this.touch();
  }

  get quotaNumber(): string | undefined {
    return this.props.quotaNumber;
  }
  set quotaNumber(value: string | undefined) {
    this.props.quotaNumber = value;
    this.touch();
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

  get creditValue(): number {
    return this.props.creditValue;
  }
  get monthlyPayment(): number {
    return this.props.monthlyPayment;
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

  get isContemplated(): boolean {
    return this.props.isContemplated;
  }
  set isContemplated(value: boolean) {
    this.props.isContemplated = value;
    this.touch();
  }

  get contemplatedAt(): Date | undefined {
    return this.props.contemplatedAt;
  }
  set contemplatedAt(value: Date | undefined) {
    this.props.contemplatedAt = value;
    this.touch();
  }

  get contemplationType(): string | undefined {
    return this.props.contemplationType;
  }
  set contemplationType(value: string | undefined) {
    this.props.contemplationType = value;
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

  get paymentDay(): number | undefined {
    return this.props.paymentDay;
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
      ConsortiumProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'status'
      | 'paidInstallments'
      | 'isContemplated'
      | 'metadata'
    >,
    id?: UniqueEntityID,
  ): Consortium {
    return new Consortium(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'ACTIVE',
        paidInstallments: props.paidInstallments ?? 0,
        isContemplated: props.isContemplated ?? false,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
