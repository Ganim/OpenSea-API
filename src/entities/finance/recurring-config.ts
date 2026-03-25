import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import type {
  FinanceEntryType,
  IndexationType,
  RecurringConfigStatus,
  RecurrenceUnit,
} from './finance-entry-types';

export interface RecurringConfigProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  type: FinanceEntryType;
  status: RecurringConfigStatus;
  description: string;
  categoryId: UniqueEntityID;
  costCenterId?: UniqueEntityID;
  bankAccountId?: UniqueEntityID;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  expectedAmount: number;
  isVariable: boolean;
  frequencyUnit: RecurrenceUnit;
  frequencyInterval: number;
  startDate: Date;
  endDate?: Date;
  totalOccurrences?: number;
  generatedCount: number;
  lastGeneratedDate?: Date;
  nextDueDate?: Date;
  interestRate?: number;
  penaltyRate?: number;
  indexationType?: IndexationType;
  fixedAdjustmentRate?: number;
  lastAdjustmentDate?: Date;
  adjustmentMonth?: number;
  notes?: string;
  createdBy?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class RecurringConfig extends Entity<RecurringConfigProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): FinanceEntryType {
    return this.props.type;
  }

  get status(): RecurringConfigStatus {
    return this.props.status;
  }
  set status(value: RecurringConfigStatus) {
    this.props.status = value;
    this.touch();
  }

  get description(): string {
    return this.props.description;
  }
  set description(value: string) {
    this.props.description = value;
    this.touch();
  }

  get categoryId(): UniqueEntityID {
    return this.props.categoryId;
  }
  set categoryId(value: UniqueEntityID) {
    this.props.categoryId = value;
    this.touch();
  }

  get costCenterId(): UniqueEntityID | undefined {
    return this.props.costCenterId;
  }
  set costCenterId(value: UniqueEntityID | undefined) {
    this.props.costCenterId = value;
    this.touch();
  }

  get bankAccountId(): UniqueEntityID | undefined {
    return this.props.bankAccountId;
  }
  set bankAccountId(value: UniqueEntityID | undefined) {
    this.props.bankAccountId = value;
    this.touch();
  }

  get supplierName(): string | undefined {
    return this.props.supplierName;
  }
  set supplierName(value: string | undefined) {
    this.props.supplierName = value;
    this.touch();
  }

  get customerName(): string | undefined {
    return this.props.customerName;
  }
  set customerName(value: string | undefined) {
    this.props.customerName = value;
    this.touch();
  }

  get supplierId(): string | undefined {
    return this.props.supplierId;
  }
  set supplierId(value: string | undefined) {
    this.props.supplierId = value;
    this.touch();
  }

  get customerId(): string | undefined {
    return this.props.customerId;
  }
  set customerId(value: string | undefined) {
    this.props.customerId = value;
    this.touch();
  }

  get expectedAmount(): number {
    return this.props.expectedAmount;
  }
  set expectedAmount(value: number) {
    this.props.expectedAmount = value;
    this.touch();
  }

  get isVariable(): boolean {
    return this.props.isVariable;
  }

  get frequencyUnit(): RecurrenceUnit {
    return this.props.frequencyUnit;
  }
  set frequencyUnit(value: RecurrenceUnit) {
    this.props.frequencyUnit = value;
    this.touch();
  }

  get frequencyInterval(): number {
    return this.props.frequencyInterval;
  }
  set frequencyInterval(value: number) {
    this.props.frequencyInterval = value;
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

  get totalOccurrences(): number | undefined {
    return this.props.totalOccurrences;
  }

  get generatedCount(): number {
    return this.props.generatedCount;
  }
  set generatedCount(value: number) {
    this.props.generatedCount = value;
    this.touch();
  }

  get lastGeneratedDate(): Date | undefined {
    return this.props.lastGeneratedDate;
  }
  set lastGeneratedDate(value: Date | undefined) {
    this.props.lastGeneratedDate = value;
    this.touch();
  }

  get nextDueDate(): Date | undefined {
    return this.props.nextDueDate;
  }
  set nextDueDate(value: Date | undefined) {
    this.props.nextDueDate = value;
    this.touch();
  }

  get interestRate(): number | undefined {
    return this.props.interestRate;
  }
  set interestRate(value: number | undefined) {
    this.props.interestRate = value;
    this.touch();
  }

  get penaltyRate(): number | undefined {
    return this.props.penaltyRate;
  }
  set penaltyRate(value: number | undefined) {
    this.props.penaltyRate = value;
    this.touch();
  }

  get indexationType(): IndexationType | undefined {
    return this.props.indexationType;
  }
  set indexationType(value: IndexationType | undefined) {
    this.props.indexationType = value;
    this.touch();
  }

  get fixedAdjustmentRate(): number | undefined {
    return this.props.fixedAdjustmentRate;
  }
  set fixedAdjustmentRate(value: number | undefined) {
    this.props.fixedAdjustmentRate = value;
    this.touch();
  }

  get lastAdjustmentDate(): Date | undefined {
    return this.props.lastAdjustmentDate;
  }
  set lastAdjustmentDate(value: Date | undefined) {
    this.props.lastAdjustmentDate = value;
    this.touch();
  }

  get adjustmentMonth(): number | undefined {
    return this.props.adjustmentMonth;
  }
  set adjustmentMonth(value: number | undefined) {
    this.props.adjustmentMonth = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }
  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
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

  get isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }
  get isPaused(): boolean {
    return this.props.status === 'PAUSED';
  }
  get isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  get hasReachedLimit(): boolean {
    if (!this.props.totalOccurrences) return false;
    return this.props.generatedCount >= this.props.totalOccurrences;
  }

  get hasPassedEndDate(): boolean {
    if (!this.props.endDate) return false;
    return new Date() > this.props.endDate;
  }

  pause(): void {
    this.props.status = 'PAUSED';
    this.touch();
  }

  resume(): void {
    this.props.status = 'ACTIVE';
    this.touch();
  }

  cancel(): void {
    this.props.status = 'CANCELLED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      RecurringConfigProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'status'
      | 'generatedCount'
      | 'isVariable'
      | 'frequencyInterval'
    >,
    id?: UniqueEntityID,
  ): RecurringConfig {
    return new RecurringConfig(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'ACTIVE',
        generatedCount: props.generatedCount ?? 0,
        isVariable: props.isVariable ?? false,
        frequencyInterval: props.frequencyInterval ?? 1,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
