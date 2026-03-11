import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { PaginatedResult, PaginationParams } from '../pagination-params';

export interface CreateItemMovementSchema {
  tenantId: string;
  itemId: UniqueEntityID;
  userId: UniqueEntityID;
  quantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  movementType: MovementType;
  reasonCode?: string;
  originRef?: string;
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
  findAllPaginated(
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemMovement>>;
  findManyByItem(
    itemId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyByItemPaginated(
    itemId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemMovement>>;
  findManyByUser(
    userId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyByUserPaginated(
    userId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemMovement>>;
  findManyByType(
    movementType: MovementType,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyByTypePaginated(
    movementType: MovementType,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemMovement>>;
  findManyByBatch(
    batchNumber: string,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyByBatchPaginated(
    batchNumber: string,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemMovement>>;
  findManyBySalesOrder(
    salesOrderId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]>;
  findManyBySalesOrderPaginated(
    salesOrderId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemMovement>>;
  findManyPendingApproval(tenantId: string): Promise<ItemMovement[]>;
  update(data: UpdateItemMovementSchema): Promise<ItemMovement | null>;
  save(movement: ItemMovement): Promise<void>;
  createBatchForZoneReconfigure(data: {
    tenantId: string;
    items: Array<{
      itemId: string;
      binAddress: string;
      currentQuantity: number;
    }>;
    userId: string;
    notes?: string;
  }): Promise<number>;
}
