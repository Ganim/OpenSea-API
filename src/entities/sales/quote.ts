import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface QuoteItemProps {
  id: UniqueEntityID;
  quoteId: UniqueEntityID;
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  createdAt: Date;
  updatedAt?: Date;
}

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export interface QuoteProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: UniqueEntityID;
  title: string;
  status: QuoteStatus;
  validUntil?: Date;
  notes?: string;
  subtotal: number;
  discount: number;
  total: number;
  sentAt?: Date;
  viewedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  items: QuoteItemProps[];
}

export class Quote extends Entity<QuoteProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  set customerId(value: UniqueEntityID) {
    this.props.customerId = value;
    this.touch();
  }

  get title(): string {
    return this.props.title;
  }

  set title(value: string) {
    this.props.title = value;
    this.touch();
  }

  get status(): QuoteStatus {
    return this.props.status;
  }

  set status(value: QuoteStatus) {
    this.props.status = value;
    this.touch();
  }

  get validUntil(): Date | undefined {
    return this.props.validUntil;
  }

  set validUntil(value: Date | undefined) {
    this.props.validUntil = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  set subtotal(value: number) {
    this.props.subtotal = value;
    this.touch();
  }

  get discount(): number {
    return this.props.discount;
  }

  set discount(value: number) {
    this.props.discount = value;
    this.touch();
  }

  get total(): number {
    return this.props.total;
  }

  set total(value: number) {
    this.props.total = value;
    this.touch();
  }

  get sentAt(): Date | undefined {
    return this.props.sentAt;
  }

  set sentAt(value: Date | undefined) {
    this.props.sentAt = value;
    this.touch();
  }

  get viewedAt(): Date | undefined {
    return this.props.viewedAt;
  }

  set viewedAt(value: Date | undefined) {
    this.props.viewedAt = value;
    this.touch();
  }

  get viewCount(): number {
    return this.props.viewCount;
  }

  set viewCount(value: number) {
    this.props.viewCount = value;
    this.touch();
  }

  get lastViewedAt(): Date | undefined {
    return this.props.lastViewedAt;
  }

  set lastViewedAt(value: Date | undefined) {
    this.props.lastViewedAt = value;
    this.touch();
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
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

  get items(): QuoteItemProps[] {
    return this.props.items;
  }

  set items(value: QuoteItemProps[]) {
    this.props.items = value;
    this.touch();
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.props.isActive = true;
    this.touch();
  }

  static create(
    props: Optional<
      QuoteProps,
      | 'id'
      | 'isActive'
      | 'createdAt'
      | 'status'
      | 'subtotal'
      | 'discount'
      | 'total'
      | 'items'
      | 'viewCount'
    >,
    id?: UniqueEntityID,
  ): Quote {
    const quote = new Quote(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? 'DRAFT',
        subtotal: props.subtotal ?? 0,
        discount: props.discount ?? 0,
        total: props.total ?? 0,
        viewCount: props.viewCount ?? 0,
        items: props.items ?? [],
      },
      id,
    );

    return quote;
  }
}
