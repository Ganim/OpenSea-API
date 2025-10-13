import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { MovementType } from './value-objects/movement-type';

export interface ItemMovementProps {
  id: UniqueEntityID;
  itemId: UniqueEntityID;
  userId: UniqueEntityID;
  quantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  movementType: MovementType;
  reasonCode?: string;
  destinationRef?: string;
  batchNumber?: string;
  notes?: string;
  approvedBy?: UniqueEntityID;
  salesOrderId?: UniqueEntityID;
  createdAt: Date;
}

export class ItemMovement extends Entity<ItemMovementProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get itemId(): UniqueEntityID {
    return this.props.itemId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get quantityBefore(): number | undefined {
    return this.props.quantityBefore;
  }

  get quantityAfter(): number | undefined {
    return this.props.quantityAfter;
  }

  get movementType(): MovementType {
    return this.props.movementType;
  }

  get reasonCode(): string | undefined {
    return this.props.reasonCode;
  }

  set reasonCode(reasonCode: string | undefined) {
    this.props.reasonCode = reasonCode;
  }

  get destinationRef(): string | undefined {
    return this.props.destinationRef;
  }

  set destinationRef(ref: string | undefined) {
    this.props.destinationRef = ref;
  }

  get batchNumber(): string | undefined {
    return this.props.batchNumber;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  set notes(notes: string | undefined) {
    this.props.notes = notes;
  }

  get approvedBy(): UniqueEntityID | undefined {
    return this.props.approvedBy;
  }

  set approvedBy(approvedBy: UniqueEntityID | undefined) {
    this.props.approvedBy = approvedBy;
  }

  get salesOrderId(): UniqueEntityID | undefined {
    return this.props.salesOrderId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // Computed Properties
  get isApproved(): boolean {
    return !!this.props.approvedBy;
  }

  get requiresApproval(): boolean {
    return this.props.movementType.requiresApproval;
  }

  get canBeApproved(): boolean {
    return !this.isApproved && this.requiresApproval;
  }

  get isStockReduction(): boolean {
    return this.props.movementType.reducesStock;
  }

  get isStockIncrease(): boolean {
    return this.props.movementType.increasesStock;
  }

  get quantityDelta(): number {
    if (this.quantityBefore !== undefined && this.quantityAfter !== undefined) {
      return this.quantityAfter - this.quantityBefore;
    }
    return this.isStockReduction ? -this.quantity : this.quantity;
  }

  // Business Methods
  approve(approverId: UniqueEntityID): void {
    if (this.isApproved) {
      throw new Error('Movement already approved');
    }
    if (!this.requiresApproval) {
      throw new Error('Movement does not require approval');
    }
    this.approvedBy = approverId;
  }

  static create(
    props: Optional<ItemMovementProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): ItemMovement {
    const movement = new ItemMovement(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return movement;
  }
}
