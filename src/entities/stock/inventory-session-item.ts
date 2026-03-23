import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InventorySessionItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'MISSING'
  | 'EXTRA'
  | 'WRONG_BIN';

export type DivergenceResolution =
  | 'LOSS_REGISTERED'
  | 'TRANSFERRED'
  | 'ENTRY_CREATED'
  | 'PENDING_REVIEW';

export interface InventorySessionItemProps {
  sessionId: UniqueEntityID;
  itemId: UniqueEntityID;
  expectedBinId?: UniqueEntityID;
  actualBinId?: UniqueEntityID;
  status: InventorySessionItemStatus;
  resolution?: DivergenceResolution;
  notes?: string;
  scannedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: UniqueEntityID;
  createdAt: Date;
  updatedAt: Date;
}

export class InventorySessionItem extends Entity<InventorySessionItemProps> {
  get sessionId(): UniqueEntityID {
    return this.props.sessionId;
  }

  get itemId(): UniqueEntityID {
    return this.props.itemId;
  }

  get expectedBinId(): UniqueEntityID | undefined {
    return this.props.expectedBinId;
  }

  get actualBinId(): UniqueEntityID | undefined {
    return this.props.actualBinId;
  }

  set actualBinId(value: UniqueEntityID | undefined) {
    this.props.actualBinId = value;
  }

  get status(): InventorySessionItemStatus {
    return this.props.status;
  }

  get resolution(): DivergenceResolution | undefined {
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

  get resolvedBy(): UniqueEntityID | undefined {
    return this.props.resolvedBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
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
  confirm(): void {
    if (this.props.status !== 'PENDING') {
      throw new BadRequestError(
        `Transição de status inválida: item já está com status "${this.props.status}".`,
      );
    }
    this.props.status = 'CONFIRMED';
    this.props.scannedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markMissing(): void {
    if (this.props.status !== 'PENDING') {
      throw new BadRequestError(
        `Transição de status inválida: item já está com status "${this.props.status}".`,
      );
    }
    this.props.status = 'MISSING';
    this.props.updatedAt = new Date();
  }

  markExtra(): void {
    if (this.props.status !== 'PENDING') {
      throw new BadRequestError(
        `Transição de status inválida: item já está com status "${this.props.status}".`,
      );
    }
    this.props.status = 'EXTRA';
    this.props.scannedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markWrongBin(): void {
    if (this.props.status !== 'PENDING') {
      throw new BadRequestError(
        `Transição de status inválida: item já está com status "${this.props.status}".`,
      );
    }
    this.props.status = 'WRONG_BIN';
    this.props.scannedAt = new Date();
    this.props.updatedAt = new Date();
  }

  resolve(resolution: DivergenceResolution, userId: UniqueEntityID): void {
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
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<InventorySessionItemProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ): InventorySessionItem {
    const now = new Date();
    return new InventorySessionItem(
      {
        ...props,
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
