import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface DealProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  title: string;
  customerId: UniqueEntityID;
  contactId?: UniqueEntityID;
  pipelineId: UniqueEntityID;
  stageId: UniqueEntityID;
  status: string;
  priority: string;
  value?: number;
  currency: string;
  probability?: number;
  expectedCloseDate?: Date;
  closedAt?: Date;
  wonAt?: Date;
  lostAt?: Date;
  lostReason?: string;
  source?: string;
  tags: string[];
  customFields?: Record<string, unknown>;
  position: number;
  stageEnteredAt?: Date;
  previousDealId?: UniqueEntityID;
  assignedToUserId?: UniqueEntityID;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
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

  get contactId(): UniqueEntityID | undefined {
    return this.props.contactId;
  }

  set contactId(value: UniqueEntityID | undefined) {
    this.props.contactId = value;
    this.touch();
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

  get status(): string {
    return this.props.status;
  }

  set status(value: string) {
    this.props.status = value;
    this.touch();
  }

  get priority(): string {
    return this.props.priority;
  }

  set priority(value: string) {
    this.props.priority = value;
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

  get probability(): number | undefined {
    return this.props.probability;
  }

  set probability(value: number | undefined) {
    this.props.probability = value;
    this.touch();
  }

  get expectedCloseDate(): Date | undefined {
    return this.props.expectedCloseDate;
  }

  set expectedCloseDate(value: Date | undefined) {
    this.props.expectedCloseDate = value;
    this.touch();
  }

  get closedAt(): Date | undefined {
    return this.props.closedAt;
  }

  set closedAt(value: Date | undefined) {
    this.props.closedAt = value;
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

  get lostReason(): string | undefined {
    return this.props.lostReason;
  }

  set lostReason(value: string | undefined) {
    this.props.lostReason = value;
    this.touch();
  }

  get source(): string | undefined {
    return this.props.source;
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

  get position(): number {
    return this.props.position;
  }

  set position(value: number) {
    this.props.position = value;
    this.touch();
  }

  get stageEnteredAt(): Date | undefined {
    return this.props.stageEnteredAt;
  }

  set stageEnteredAt(value: Date | undefined) {
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

  get assignedToUserId(): UniqueEntityID | undefined {
    return this.props.assignedToUserId;
  }

  set assignedToUserId(value: UniqueEntityID | undefined) {
    this.props.assignedToUserId = value;
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

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  delete(): void {
    this.props.deletedAt = new Date();
    this.touch();
  }

  restore(): void {
    this.props.deletedAt = undefined;
    this.touch();
  }

  markAsWon(): void {
    this.props.status = 'WON';
    this.props.wonAt = new Date();
    this.props.closedAt = new Date();
    this.touch();
  }

  markAsLost(reason?: string): void {
    this.props.status = 'LOST';
    this.props.lostAt = new Date();
    this.props.closedAt = new Date();
    this.props.lostReason = reason;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      DealProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'deletedAt'
      | 'status'
      | 'priority'
      | 'currency'
      | 'tags'
      | 'position'
    >,
    id?: UniqueEntityID,
  ): Deal {
    return new Deal(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'OPEN',
        priority: props.priority ?? 'MEDIUM',
        currency: props.currency ?? 'BRL',
        tags: props.tags ?? [],
        position: props.position ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
