import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';

export interface CreateItemMovementSchema {
  tenantId: string;
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
  findById(id: UniqueEntityID, tenantId: string): Promise<ItemMovement | null>;
  findAll(tenantId: string): Promise<ItemMovement[]>;
  findManyByItem(
    itemId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyByUser(
    userId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyByType(
    movementType: MovementType,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyByBatch(
    batchNumber: string,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyBySalesOrder(
    salesOrderId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyPendingApproval(tenantId: string): Promise<ItemMovement[]>;
  update(data: UpdateItemMovementSchema): Promise<ItemMovement | null>;
  save(movement: ItemMovement): Promise<void>;
}
