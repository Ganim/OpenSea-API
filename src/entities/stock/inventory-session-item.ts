import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InventoryItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'MISSING'
  | 'EXTRA'
  | 'WRONG_BIN';

export type InventoryItemResolution =
  | 'LOSS_REGISTERED'
  | 'TRANSFERRED'
  | 'ENTRY_CREATED'
  | 'PENDING_REVIEW';

export interface InventorySessionItemProps {
  sessionId: string;
  itemId?: string;
  binId: string;
  status: InventoryItemStatus;
  resolution?: InventoryItemResolution;
  notes?: string;
  scannedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

export class InventorySessionItem extends Entity<InventorySessionItemProps> {
  get sessionId(): string {
    return this.props.sessionId;
  }

  get itemId(): string | undefined {
    return this.props.itemId;
  }

  get binId(): string {
    return this.props.binId;
  }

  get status(): InventoryItemStatus {
    return this.props.status;
  }

  get resolution(): InventoryItemResolution | undefined {
    return this.props.resolution;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
  }

  get scannedAt(): Date | undefined {
    return this.props.scannedAt;
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  get resolvedBy(): string | undefined {
    return this.props.resolvedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Computed properties
  get isDivergent(): boolean {
    return (
      this.props.status === 'MISSING' ||
      this.props.status === 'EXTRA' ||
      this.props.status === 'WRONG_BIN'
    );
  }

  get isResolved(): boolean {
    return this.props.resolution !== undefined;
  }

  // Status methods
  private guardNotResolved(): void {
    if (this.props.status !== 'PENDING') {
      throw new BadRequestError(
        `Transição de status inválida: item já está com status "${this.props.status}".`,
      );
    }
  }

  confirm(): void {
    this.guardNotResolved();
    this.props.status = 'CONFIRMED';
    this.props.scannedAt = new Date();
  }

  markMissing(): void {
    this.guardNotResolved();
    this.props.status = 'MISSING';
  }

  markExtra(): void {
    this.guardNotResolved();
    this.props.status = 'EXTRA';
    this.props.scannedAt = new Date();
  }

  markWrongBin(): void {
    this.guardNotResolved();
    this.props.status = 'WRONG_BIN';
    this.props.scannedAt = new Date();
  }

  resolve(resolution: InventoryItemResolution, userId: string): void {
    if (!this.isDivergent) {
      throw new BadRequestError(
        `Não é possível resolver um item com status "${this.props.status}". Apenas itens divergentes podem ser resolvidos.`,
      );
    }
    if (this.isResolved) {
      throw new BadRequestError('Este item já foi resolvido.');
    }
    this.props.resolution = resolution;
    this.props.resolvedAt = new Date();
    this.props.resolvedBy = userId;
  }

  static create(
    props: Optional<InventorySessionItemProps, 'status' | 'createdAt'>,
    id?: UniqueEntityID,
  ): InventorySessionItem {
    return new InventorySessionItem(
      {
        ...props,
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
