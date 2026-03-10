import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ContractProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  code: string;
  title: string;
  description?: string;
  status: string; // DRAFT | ACTIVE | EXPIRED | RENEWED | CANCELLED
  companyId?: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  totalValue: number;
  paymentFrequency: string; // RecurrenceUnit
  paymentAmount: number;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  renewalPeriodMonths?: number;
  alertDaysBefore: number;
  folderPath?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Contract extends Entity<ContractProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get code(): string {
    return this.props.code;
  }

  get title(): string {
    return this.props.title;
  }
  set title(value: string) {
    this.props.title = value;
    this.touch();
  }

  get description(): string | undefined {
    return this.props.description;
  }
  set description(value: string | undefined) {
    this.props.description = value;
    this.touch();
  }

  get status(): string {
    return this.props.status;
  }
  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get companyId(): string | undefined {
    return this.props.companyId;
  }
  set companyId(value: string | undefined) {
    this.props.companyId = value;
    this.touch();
  }

  get companyName(): string {
    return this.props.companyName;
  }
  set companyName(value: string) {
    this.props.companyName = value;
    this.touch();
  }

  get contactName(): string | undefined {
    return this.props.contactName;
  }
  set contactName(value: string | undefined) {
    this.props.contactName = value;
    this.touch();
  }

  get contactEmail(): string | undefined {
    return this.props.contactEmail;
  }
  set contactEmail(value: string | undefined) {
    this.props.contactEmail = value;
    this.touch();
  }

  get totalValue(): number {
    return this.props.totalValue;
  }
  set totalValue(value: number) {
    this.props.totalValue = value;
    this.touch();
  }

  get paymentFrequency(): string {
    return this.props.paymentFrequency;
  }
  set paymentFrequency(value: string) {
    this.props.paymentFrequency = value;
    this.touch();
  }

  get paymentAmount(): number {
    return this.props.paymentAmount;
  }
  set paymentAmount(value: number) {
    this.props.paymentAmount = value;
    this.touch();
  }

  get categoryId(): string | undefined {
    return this.props.categoryId;
  }
  set categoryId(value: string | undefined) {
    this.props.categoryId = value;
    this.touch();
  }

  get costCenterId(): string | undefined {
    return this.props.costCenterId;
  }
  set costCenterId(value: string | undefined) {
    this.props.costCenterId = value;
    this.touch();
  }

  get bankAccountId(): string | undefined {
    return this.props.bankAccountId;
  }
  set bankAccountId(value: string | undefined) {
    this.props.bankAccountId = value;
    this.touch();
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date {
    return this.props.endDate;
  }
  set endDate(value: Date) {
    this.props.endDate = value;
    this.touch();
  }

  get autoRenew(): boolean {
    return this.props.autoRenew;
  }
  set autoRenew(value: boolean) {
    this.props.autoRenew = value;
    this.touch();
  }

  get renewalPeriodMonths(): number | undefined {
    return this.props.renewalPeriodMonths;
  }
  set renewalPeriodMonths(value: number | undefined) {
    this.props.renewalPeriodMonths = value;
    this.touch();
  }

  get alertDaysBefore(): number {
    return this.props.alertDaysBefore;
  }
  set alertDaysBefore(value: number) {
    this.props.alertDaysBefore = value;
    this.touch();
  }

  get folderPath(): string | undefined {
    return this.props.folderPath;
  }
  set folderPath(value: string | undefined) {
    this.props.folderPath = value;
    this.touch();
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

  // Computed getters
  get isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }
  get isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }
  get isExpired(): boolean {
    return this.props.status === 'EXPIRED';
  }
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get daysUntilExpiration(): number {
    const now = new Date();
    const diff = this.props.endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
      ContractProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'status'
      | 'autoRenew'
      | 'alertDaysBefore'
      | 'metadata'
    >,
    id?: UniqueEntityID,
  ): Contract {
    return new Contract(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'ACTIVE',
        autoRenew: props.autoRenew ?? false,
        alertDaysBefore: props.alertDaysBefore ?? 30,
        metadata: props.metadata ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
