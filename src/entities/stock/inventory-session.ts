import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InventorySessionMode = 'BIN' | 'ZONE' | 'PRODUCT';
export type InventorySessionStatus = 'OPEN' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface InventorySessionProps {
  tenantId: UniqueEntityID;
  userId: UniqueEntityID;
  mode: InventorySessionMode;
  status: InventorySessionStatus;
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
  updatedAt: Date;
}

export class InventorySession extends Entity<InventorySessionProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get mode(): InventorySessionMode {
    return this.props.mode;
  }

  get status(): InventorySessionStatus {
    return this.props.status;
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
  }

  get scannedItems(): number {
    return this.props.scannedItems;
  }

  set scannedItems(value: number) {
    this.props.scannedItems = value;
  }

  get confirmedItems(): number {
    return this.props.confirmedItems;
  }

  set confirmedItems(value: number) {
    this.props.confirmedItems = value;
  }

  get divergentItems(): number {
    return this.props.divergentItems;
  }

  set divergentItems(value: number) {
    this.props.divergentItems = value;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
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

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Computed properties
  get isActive(): boolean {
    return this.props.status === 'OPEN' || this.props.status === 'PAUSED';
  }

  get isOpen(): boolean {
    return this.props.status === 'OPEN';
  }

  get progress(): number {
    if (this.props.totalItems === 0) return 0;
    return (this.props.confirmedItems / this.props.totalItems) * 100;
  }

  // State transition methods
  pause(): void {
    if (this.props.status !== 'OPEN') {
      throw new BadRequestError(
        `Transição de status inválida: não é possível pausar uma sessão com status "${this.props.status}". Apenas sessões abertas podem ser pausadas.`,
      );
    }
    this.props.status = 'PAUSED';
    this.props.updatedAt = new Date();
  }

  resume(): void {
    if (this.props.status !== 'PAUSED') {
      throw new BadRequestError(
        `Transição de status inválida: não é possível retomar uma sessão com status "${this.props.status}". Apenas sessões pausadas podem ser retomadas.`,
      );
    }
    this.props.status = 'OPEN';
    this.props.updatedAt = new Date();
  }

  complete(): void {
    if (this.props.status !== 'OPEN') {
      throw new BadRequestError(
        `Transição de status inválida: não é possível completar uma sessão com status "${this.props.status}". Apenas sessões abertas podem ser completadas.`,
      );
    }
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status !== 'OPEN' && this.props.status !== 'PAUSED') {
      throw new BadRequestError(
        `Transição de status inválida: não é possível cancelar uma sessão com status "${this.props.status}". Apenas sessões abertas ou pausadas podem ser canceladas.`,
      );
    }
    this.props.status = 'CANCELLED';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      InventorySessionProps,
      | 'status'
      | 'totalItems'
      | 'scannedItems'
      | 'confirmedItems'
      | 'divergentItems'
      | 'startedAt'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): InventorySession {
    const now = new Date();
    return new InventorySession(
      {
        ...props,
        status: props.status ?? 'OPEN',
        totalItems: props.totalItems ?? 0,
        scannedItems: props.scannedItems ?? 0,
        confirmedItems: props.confirmedItems ?? 0,
        divergentItems: props.divergentItems ?? 0,
        startedAt: props.startedAt ?? now,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
