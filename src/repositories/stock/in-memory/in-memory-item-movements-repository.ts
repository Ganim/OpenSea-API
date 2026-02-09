import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type {
  CreateItemMovementSchema,
  ItemMovementsRepository,
  UpdateItemMovementSchema,
} from '../item-movements-repository';

export class InMemoryItemMovementsRepository
  implements ItemMovementsRepository
{
  public items: ItemMovement[] = [];

  async create(data: CreateItemMovementSchema): Promise<ItemMovement> {
    const movement = ItemMovement.create({
      tenantId: new UniqueEntityID(data.tenantId),
      itemId: data.itemId,
      userId: data.userId,
      quantity: data.quantity,
      quantityBefore: data.quantityBefore,
      quantityAfter: data.quantityAfter,
      movementType: data.movementType,
      reasonCode: data.reasonCode,
      originRef: data.originRef,
      destinationRef: data.destinationRef,
      batchNumber: data.batchNumber,
      notes: data.notes,
      salesOrderId: data.salesOrderId,
    });

    this.items.push(movement);
    return movement;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement | null> {
    const movement = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return movement ?? null;
  }

  async findManyByItem(
    itemId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) =>
        movement.itemId.equals(itemId) &&
        movement.tenantId.toString() === tenantId,
    );
  }

  async findManyByUser(
    userId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) =>
        movement.userId.equals(userId) &&
        movement.tenantId.toString() === tenantId,
    );
  }

  async findManyByType(
    movementType: MovementType,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) =>
        movement.movementType.value === movementType.value &&
        movement.tenantId.toString() === tenantId,
    );
  }

  async findManyByBatch(
    batchNumber: string,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) =>
        movement.batchNumber === batchNumber &&
        movement.tenantId.toString() === tenantId,
    );
  }

  async findManyBySalesOrder(
    salesOrderId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) =>
        movement.salesOrderId?.equals(salesOrderId) &&
        movement.tenantId.toString() === tenantId,
    );
  }

  async findManyPendingApproval(tenantId: string): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) =>
        !movement.approvedBy && movement.tenantId.toString() === tenantId,
    );
  }

  async findAll(tenantId: string): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) => movement.tenantId.toString() === tenantId,
    );
  }

  async update(data: UpdateItemMovementSchema): Promise<ItemMovement | null> {
    const movement = this.items.find((item) => item.id.equals(data.id)) ?? null;
    if (!movement) return null;

    if (data.reasonCode !== undefined) movement.reasonCode = data.reasonCode;
    if (data.destinationRef !== undefined)
      movement.destinationRef = data.destinationRef;
    if (data.notes !== undefined) movement.notes = data.notes;
    if (data.approvedBy !== undefined) movement.approvedBy = data.approvedBy;

    return movement;
  }

  async save(movement: ItemMovement): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(movement.id));
    if (index >= 0) {
      this.items[index] = movement;
    } else {
      this.items.push(movement);
    }
  }

  async createBatchForZoneReconfigure(data: {
    tenantId: string;
    items: Array<{
      itemId: string;
      binAddress: string;
      currentQuantity: number;
    }>;
    userId: string;
    notes?: string;
  }): Promise<number> {
    let count = 0;
    for (const item of data.items) {
      const movement = ItemMovement.create({
        tenantId: new UniqueEntityID(data.tenantId),
        itemId: new UniqueEntityID(item.itemId),
        userId: new UniqueEntityID(data.userId),
        quantity: item.currentQuantity,
        quantityBefore: item.currentQuantity,
        quantityAfter: item.currentQuantity,
        movementType: MovementType.create('ZONE_RECONFIGURE'),
        originRef: `Bin: ${item.binAddress}`,
        reasonCode: 'ZONE_RECONFIGURE',
        notes: data.notes,
      });
      this.items.push(movement);
      count++;
    }
    return count;
  }
}
