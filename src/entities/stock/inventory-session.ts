import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InventorySessionStatus =
  | 'OPEN'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type InventorySessionMode = 'BIN' | 'ZONE' | 'PRODUCT';

export interface InventorySessionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  userId: UniqueEntityID;
  status: InventorySessionStatus;
  mode: InventorySessionMode;
  binId?: UniqueEntityID;
  zoneId?: UniqueEntityID;
  productId?: UniqueEntityID;
  variantId?: UniqueEntityID;
  totalItems: number;
  scannedItems: number;
  confirmedItems: number;
  divergentItems: number;
  notes?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class InventorySession extends Entity<InventorySessionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get status(): InventorySessionStatus {
    return this.props.status;
  }

  get mode(): InventorySessionMode {
    return this.props.mode;
  }

  get binId(): UniqueEntityID | undefined {
    return this.props.binId;
  }

  get zoneId(): UniqueEntityID | undefined {
    return this.props.zoneId;
  }

  get productId(): UniqueEntityID | undefined {
    return this.props.productId;
  }

  get variantId(): UniqueEntityID | undefined {
    return this.props.variantId;
  }

  get totalItems(): number {
    return this.props.totalItems;
  }

  set totalItems(value: number) {
    this.props.totalItems = value;
    this.touch();
  }

  get scannedItems(): number {
    return this.props.scannedItems;
  }

  set scannedItems(value: number) {
    this.props.scannedItems = value;
    this.touch();
  }

  get confirmedItems(): number {
    return this.props.confirmedItems;
  }

  set confirmedItems(value: number) {
    this.props.confirmedItems = value;
    this.touch();
  }

  get divergentItems(): number {
    return this.props.divergentItems;
  }

  set divergentItems(value: number) {
    this.props.divergentItems = value;
    this.touch();
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Computed
  get isOpen(): boolean {
    return this.props.status === 'OPEN';
  }

  get isPaused(): boolean {
    return this.props.status === 'PAUSED';
  }

  get isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  get isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  get isActive(): boolean {
    return this.isOpen || this.isPaused;
  }

  get progress(): number {
    if (this.props.totalItems === 0) return 0;
    return Math.round((this.props.scannedItems / this.props.totalItems) * 100);
  }

  // State transitions
  pause(): void {
    if (this.props.status !== 'OPEN') {
      throw new BadRequestError('Only OPEN sessions can be paused.');
    }
    this.props.status = 'PAUSED';
    this.touch();
  }

  resume(): void {
    if (this.props.status !== 'PAUSED') {
      throw new BadRequestError('Only PAUSED sessions can be resumed.');
    }
    this.props.status = 'OPEN';
    this.touch();
  }

  complete(): void {
    if (this.props.status !== 'OPEN' && this.props.status !== 'PAUSED') {
      throw new BadRequestError(
        'Only OPEN or PAUSED sessions can be completed.',
      );
    }
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.touch();
  }

  cancel(): void {
    if (this.props.status !== 'OPEN' && this.props.status !== 'PAUSED') {
      throw new BadRequestError(
        'Only OPEN or PAUSED sessions can be cancelled.',
      );
    }
    this.props.status = 'CANCELLED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      InventorySessionProps,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'scannedItems'
      | 'confirmedItems'
      | 'divergentItems'
      | 'totalItems'
      | 'startedAt'
    >,
    id?: UniqueEntityID,
  ): InventorySession {
    return new InventorySession(
      {
        ...props,
        id: id ?? props.id ?? new UniqueEntityID(),
        status: props.status ?? 'OPEN',
        totalItems: props.totalItems ?? 0,
        scannedItems: props.scannedItems ?? 0,
        confirmedItems: props.confirmedItems ?? 0,
        divergentItems: props.divergentItems ?? 0,
        startedAt: props.startedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
