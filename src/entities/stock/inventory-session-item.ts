import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type InventorySessionItemStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'MISSING'
  | 'WRONG_BIN'
  | 'EXTRA';

export type DivergenceResolution =
  | 'LOSS_REGISTERED'
  | 'TRANSFERRED'
  | 'ENTRY_CREATED'
  | 'PENDING_REVIEW';

export interface InventorySessionItemProps {
  id: UniqueEntityID;
  sessionId: UniqueEntityID;
  itemId: UniqueEntityID;
  expectedBinId?: UniqueEntityID;
  actualBinId?: UniqueEntityID;
  status: InventorySessionItemStatus;
  scannedAt?: Date;
  resolution?: DivergenceResolution;
  resolvedBy?: UniqueEntityID;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export class InventorySessionItem extends Entity<InventorySessionItemProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

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
    this.touch();
  }

  get status(): InventorySessionItemStatus {
    return this.props.status;
  }

  get scannedAt(): Date | undefined {
    return this.props.scannedAt;
  }

  get resolution(): DivergenceResolution | undefined {
    return this.props.resolution;
  }

  get resolvedBy(): UniqueEntityID | undefined {
    return this.props.resolvedBy;
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(value: string | undefined) {
    this.props.notes = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Computed
  get isDivergent(): boolean {
    return (
      this.props.status === 'MISSING' ||
      this.props.status === 'WRONG_BIN' ||
      this.props.status === 'EXTRA'
    );
  }

  get isResolved(): boolean {
    return !!this.props.resolution;
  }

  // Business methods
  confirm(): void {
    this.props.status = 'CONFIRMED';
    this.props.scannedAt = new Date();
    this.touch();
  }

  markMissing(): void {
    this.props.status = 'MISSING';
    this.touch();
  }

  resolve(resolution: DivergenceResolution, resolvedBy: UniqueEntityID): void {
    if (!this.isDivergent) {
      throw new BadRequestError('Only divergent items can be resolved.');
    }
    if (this.isResolved) {
      throw new BadRequestError('Item already resolved.');
    }
    this.props.resolution = resolution;
    this.props.resolvedBy = resolvedBy;
    this.props.resolvedAt = new Date();
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      InventorySessionItemProps,
      'id' | 'createdAt' | 'updatedAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): InventorySessionItem {
    return new InventorySessionItem(
      {
        ...props,
        id: id ?? props.id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt,
      },
      id,
    );
  }
}
