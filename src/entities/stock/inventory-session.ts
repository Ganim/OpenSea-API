import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InventorySessionMode = 'BIN' | 'ZONE' | 'PRODUCT';
export type InventorySessionStatus = 'OPEN' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface InventorySessionProps {
  tenantId: UniqueEntityID;
  mode: InventorySessionMode;
  status: InventorySessionStatus;
  scope: Record<string, unknown>;
  totalItems: number;
  confirmedItems: number;
  divergences: number;
  notes?: string;
  startedAt: Date;
  pausedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  deletedAt?: Date;
  startedBy: string;
}

export class InventorySession extends Entity<InventorySessionProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get mode(): InventorySessionMode {
    return this.props.mode;
  }

  get status(): InventorySessionStatus {
    return this.props.status;
  }

  get scope(): Record<string, unknown> {
    return this.props.scope;
  }

  get totalItems(): number {
    return this.props.totalItems;
  }

  set totalItems(value: number) {
    this.props.totalItems = value;
  }

  get confirmedItems(): number {
    return this.props.confirmedItems;
  }

  set confirmedItems(value: number) {
    this.props.confirmedItems = value;
  }

  get divergences(): number {
    return this.props.divergences;
  }

  set divergences(value: number) {
    this.props.divergences = value;
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

  get pausedAt(): Date | undefined {
    return this.props.pausedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get startedBy(): string {
    return this.props.startedBy;
  }

  // Computed properties
  get isActive(): boolean {
    return this.props.status === 'OPEN' || this.props.status === 'PAUSED';
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
    this.props.pausedAt = new Date();
  }

  resume(): void {
    if (this.props.status !== 'PAUSED') {
      throw new BadRequestError(
        `Transição de status inválida: não é possível retomar uma sessão com status "${this.props.status}". Apenas sessões pausadas podem ser retomadas.`,
      );
    }
    this.props.status = 'OPEN';
    this.props.pausedAt = undefined;
  }

  complete(): void {
    if (this.props.status !== 'OPEN') {
      throw new BadRequestError(
        `Transição de status inválida: não é possível completar uma sessão com status "${this.props.status}". Apenas sessões abertas podem ser completadas.`,
      );
    }
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
  }

  cancel(): void {
    if (this.props.status !== 'OPEN' && this.props.status !== 'PAUSED') {
      throw new BadRequestError(
        `Transição de status inválida: não é possível cancelar uma sessão com status "${this.props.status}". Apenas sessões abertas ou pausadas podem ser canceladas.`,
      );
    }
    this.props.status = 'CANCELLED';
    this.props.completedAt = new Date();
  }

  delete(): void {
    this.props.deletedAt = new Date();
  }

  static create(
    props: Optional<
      InventorySessionProps,
      | 'status'
      | 'totalItems'
      | 'confirmedItems'
      | 'divergences'
      | 'startedAt'
      | 'createdAt'
      | 'deletedAt'
    >,
    id?: UniqueEntityID,
  ): InventorySession {
    return new InventorySession(
      {
        ...props,
        status: props.status ?? 'OPEN',
        totalItems: props.totalItems ?? 0,
        confirmedItems: props.confirmedItems ?? 0,
        divergences: props.divergences ?? 0,
        startedAt: props.startedAt ?? new Date(),
        createdAt: props.createdAt ?? new Date(),
        deletedAt: props.deletedAt,
      },
      id,
    );
  }
}
