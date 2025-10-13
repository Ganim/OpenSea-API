import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';

export interface CreateItemMovementSchema {
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
  salesOrderId?: UniqueEntityID;
}

export interface UpdateItemMovementSchema {
  id: UniqueEntityID;
  reasonCode?: string;
  destinationRef?: string;
  notes?: string;
  approvedBy?: UniqueEntityID;
}

export interface ItemMovementsRepository {
  create(data: CreateItemMovementSchema): Promise<ItemMovement>;
  findById(id: UniqueEntityID): Promise<ItemMovement | null>;
  findManyByItem(itemId: UniqueEntityID): Promise<ItemMovement[]>;
  findManyByUser(userId: UniqueEntityID): Promise<ItemMovement[]>;
  findManyByType(movementType: MovementType): Promise<ItemMovement[]>;
  findManyByBatch(batchNumber: string): Promise<ItemMovement[]>;
  findManyBySalesOrder(salesOrderId: UniqueEntityID): Promise<ItemMovement[]>;
  findManyPendingApproval(): Promise<ItemMovement[]>;
  update(data: UpdateItemMovementSchema): Promise<ItemMovement | null>;
  save(movement: ItemMovement): Promise<void>;
}
