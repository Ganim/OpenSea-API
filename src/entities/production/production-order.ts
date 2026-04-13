import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type ProductionOrderStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'FIRM'
  | 'RELEASED'
  | 'IN_PROCESS'
  | 'TECHNICALLY_COMPLETE'
  | 'CLOSED'
  | 'CANCELLED';

export interface ProductionOrderProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  orderNumber: string;
  bomId: UniqueEntityID;
  productId: UniqueEntityID;
  salesOrderId: UniqueEntityID | null;
  parentOrderId: UniqueEntityID | null;
  status: ProductionOrderStatus;
  priority: number;
  quantityPlanned: number;
  quantityStarted: number;
  quantityCompleted: number;
  quantityScrapped: number;
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  releasedAt: Date | null;
  releasedById: UniqueEntityID | null;
  notes: string | null;
  createdById: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductionOrder extends Entity<ProductionOrderProps> {
  // Getters
  get productionOrderId(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get bomId(): UniqueEntityID {
    return this.props.bomId;
  }

  get productId(): UniqueEntityID {
    return this.props.productId;
  }

  get salesOrderId(): UniqueEntityID | null {
    return this.props.salesOrderId;
  }

  get parentOrderId(): UniqueEntityID | null {
    return this.props.parentOrderId;
  }

  get status(): ProductionOrderStatus {
    return this.props.status;
  }

  get priority(): number {
    return this.props.priority;
  }

  get quantityPlanned(): number {
    return this.props.quantityPlanned;
  }

  get quantityStarted(): number {
    return this.props.quantityStarted;
  }

  get quantityCompleted(): number {
    return this.props.quantityCompleted;
  }

  get quantityScrapped(): number {
    return this.props.quantityScrapped;
  }

  get plannedStartDate(): Date | null {
    return this.props.plannedStartDate;
  }

  get plannedEndDate(): Date | null {
    return this.props.plannedEndDate;
  }

  get actualStartDate(): Date | null {
    return this.props.actualStartDate;
  }

  get actualEndDate(): Date | null {
    return this.props.actualEndDate;
  }

  get releasedAt(): Date | null {
    return this.props.releasedAt;
  }

  get releasedById(): UniqueEntityID | null {
    return this.props.releasedById;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get createdById(): UniqueEntityID {
    return this.props.createdById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed Properties
  get completionPercentage(): number {
    if (this.quantityPlanned === 0) return 0;
    return Math.round((this.quantityCompleted / this.quantityPlanned) * 100);
  }

  get isOverdue(): boolean {
    if (!this.plannedEndDate) return false;
    if (this.status === 'CLOSED' || this.status === 'CANCELLED') return false;
    return new Date() > this.plannedEndDate;
  }

  get quantityRemaining(): number {
    return (
      this.quantityPlanned - this.quantityCompleted - this.quantityScrapped
    );
  }

  // Setters
  set orderNumber(orderNumber: string) {
    this.props.orderNumber = orderNumber;
    this.touch();
  }

  set bomId(bomId: UniqueEntityID) {
    this.props.bomId = bomId;
    this.touch();
  }

  set productId(productId: UniqueEntityID) {
    this.props.productId = productId;
    this.touch();
  }

  set salesOrderId(salesOrderId: UniqueEntityID | null) {
    this.props.salesOrderId = salesOrderId;
    this.touch();
  }

  set parentOrderId(parentOrderId: UniqueEntityID | null) {
    this.props.parentOrderId = parentOrderId;
    this.touch();
  }

  set status(status: ProductionOrderStatus) {
    this.props.status = status;
    this.touch();
  }

  set priority(priority: number) {
    this.props.priority = priority;
    this.touch();
  }

  set quantityPlanned(quantityPlanned: number) {
    this.props.quantityPlanned = quantityPlanned;
    this.touch();
  }

  set quantityStarted(quantityStarted: number) {
    this.props.quantityStarted = quantityStarted;
    this.touch();
  }

  set quantityCompleted(quantityCompleted: number) {
    this.props.quantityCompleted = quantityCompleted;
    this.touch();
  }

  set quantityScrapped(quantityScrapped: number) {
    this.props.quantityScrapped = quantityScrapped;
    this.touch();
  }

  set plannedStartDate(plannedStartDate: Date | null) {
    this.props.plannedStartDate = plannedStartDate;
    this.touch();
  }

  set plannedEndDate(plannedEndDate: Date | null) {
    this.props.plannedEndDate = plannedEndDate;
    this.touch();
  }

  set actualStartDate(actualStartDate: Date | null) {
    this.props.actualStartDate = actualStartDate;
    this.touch();
  }

  set actualEndDate(actualEndDate: Date | null) {
    this.props.actualEndDate = actualEndDate;
    this.touch();
  }

  set notes(notes: string | null) {
    this.props.notes = notes;
    this.touch();
  }

  // Business Methods
  plan(): void {
    this.status = 'PLANNED';
  }

  firm(): void {
    this.status = 'FIRM';
  }

  release(userId: string): void {
    this.props.releasedById = new UniqueEntityID(userId);
    this.props.releasedAt = new Date();
    this.status = 'RELEASED';
  }

  start(): void {
    this.props.actualStartDate = new Date();
    this.status = 'IN_PROCESS';
  }

  complete(): void {
    this.props.actualEndDate = new Date();
    this.status = 'TECHNICALLY_COMPLETE';
  }

  close(): void {
    this.status = 'CLOSED';
  }

  cancel(): void {
    this.status = 'CANCELLED';
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ProductionOrderProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'salesOrderId'
      | 'parentOrderId'
      | 'status'
      | 'quantityStarted'
      | 'quantityCompleted'
      | 'quantityScrapped'
      | 'plannedStartDate'
      | 'plannedEndDate'
      | 'actualStartDate'
      | 'actualEndDate'
      | 'releasedAt'
      | 'releasedById'
      | 'notes'
    >,
    id?: UniqueEntityID,
  ): ProductionOrder {
    const productionOrderId = id ?? props.id ?? new UniqueEntityID();

    const productionOrder = new ProductionOrder(
      {
        ...props,
        id: productionOrderId,
        salesOrderId: props.salesOrderId ?? null,
        parentOrderId: props.parentOrderId ?? null,
        status: props.status ?? 'DRAFT',
        quantityStarted: props.quantityStarted ?? 0,
        quantityCompleted: props.quantityCompleted ?? 0,
        quantityScrapped: props.quantityScrapped ?? 0,
        plannedStartDate: props.plannedStartDate ?? null,
        plannedEndDate: props.plannedEndDate ?? null,
        actualStartDate: props.actualStartDate ?? null,
        actualEndDate: props.actualEndDate ?? null,
        releasedAt: props.releasedAt ?? null,
        releasedById: props.releasedById ?? null,
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      productionOrderId,
    );

    return productionOrder;
  }
}
