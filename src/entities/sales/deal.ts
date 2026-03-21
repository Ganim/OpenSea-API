import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface DealProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  title: string;
  customerId: UniqueEntityID;
  pipelineId: UniqueEntityID;
  stageId: UniqueEntityID;
  value?: number;
  currency: string;
  expectedCloseDate?: Date;
  probability?: number;
  status: string;
  lostReason?: string;
  wonAt?: Date;
  lostAt?: Date;
  closedAt?: Date;
  assignedToUserId?: UniqueEntityID;
  tags: string[];
  customFields?: Record<string, unknown>;
  aiInsights?: Record<string, unknown>;
  stageEnteredAt: Date;
  previousDealId?: UniqueEntityID;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class Deal extends Entity<DealProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get title(): string {
    return this.props.title;
  }

  set title(value: string) {
    this.props.title = value;
    this.touch();
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  get pipelineId(): UniqueEntityID {
    return this.props.pipelineId;
  }

  get stageId(): UniqueEntityID {
    return this.props.stageId;
  }

  set stageId(value: UniqueEntityID) {
    this.props.stageId = value;
    this.touch();
  }

  get value(): number | undefined {
    return this.props.value;
  }

  set value(value: number | undefined) {
    this.props.value = value;
    this.touch();
  }

  get currency(): string {
    return this.props.currency;
  }

  set currency(value: string) {
    this.props.currency = value;
    this.touch();
  }

  get expectedCloseDate(): Date | undefined {
    return this.props.expectedCloseDate;
  }

  set expectedCloseDate(value: Date | undefined) {
    this.props.expectedCloseDate = value;
    this.touch();
  }

  get probability(): number | undefined {
    return this.props.probability;
  }

  set probability(value: number | undefined) {
    this.props.probability = value;
    this.touch();
  }

  get status(): string {
    return this.props.status;
  }

  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get lostReason(): string | undefined {
    return this.props.lostReason;
  }

  set lostReason(value: string | undefined) {
    this.props.lostReason = value;
    this.touch();
  }

  get wonAt(): Date | undefined {
    return this.props.wonAt;
  }

  set wonAt(value: Date | undefined) {
    this.props.wonAt = value;
    this.touch();
  }

  get lostAt(): Date | undefined {
    return this.props.lostAt;
  }

  set lostAt(value: Date | undefined) {
    this.props.lostAt = value;
    this.touch();
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  set closedAt(value: Date | undefined) {
    this.props.closedAt = value;
    this.touch();
  }

  get assignedToUserId(): UniqueEntityID | undefined {
    return this.props.assignedToUserId;
  }

  set assignedToUserId(value: UniqueEntityID | undefined) {
    this.props.assignedToUserId = value;
    this.touch();
  }

  get tags(): string[] {
    return this.props.tags;
  }

  set tags(value: string[]) {
    this.props.tags = value;
    this.touch();
  }

  get customFields(): Record<string, unknown> | undefined {
    return this.props.customFields;
  }

  set customFields(value: Record<string, unknown> | undefined) {
    this.props.customFields = value;
    this.touch();
  }

  get aiInsights(): Record<string, unknown> | undefined {
    return this.props.aiInsights;
  }

  set aiInsights(value: Record<string, unknown> | undefined) {
    this.props.aiInsights = value;
    this.touch();
  }

  get stageEnteredAt(): Date {
    return this.props.stageEnteredAt;
  }

  set stageEnteredAt(value: Date) {
    this.props.stageEnteredAt = value;
    this.touch();
  }

  get previousDealId(): UniqueEntityID | undefined {
    return this.props.previousDealId;
  }

  set previousDealId(value: UniqueEntityID | undefined) {
    this.props.previousDealId = value;
    this.touch();
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

  // Computed Properties
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get isOpen(): boolean {
    return this.props.status === 'OPEN';
  }

  get isWon(): boolean {
    return this.props.status === 'WON';
  }

  get isLost(): boolean {
    return this.props.status === 'LOST';
  }

  // Business Methods
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
      DealProps,
      'id' | 'createdAt' | 'tags' | 'currency' | 'status' | 'stageEnteredAt'
    >,
    id?: UniqueEntityID,
  ): Deal {
    const deal = new Deal(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        tags: props.tags ?? [],
        currency: props.currency ?? 'BRL',
        status: props.status ?? 'OPEN',
        stageEnteredAt: props.stageEnteredAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return deal;
  }
}
