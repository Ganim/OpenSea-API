import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
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
      itemId: data.itemId,
      userId: data.userId,
      quantity: data.quantity,
      quantityBefore: data.quantityBefore,
      quantityAfter: data.quantityAfter,
      movementType: data.movementType,
      reasonCode: data.reasonCode,
      destinationRef: data.destinationRef,
      batchNumber: data.batchNumber,
      notes: data.notes,
      salesOrderId: data.salesOrderId,
    });

    this.items.push(movement);
    return movement;
  }

  async findById(id: UniqueEntityID): Promise<ItemMovement | null> {
    const movement = this.items.find((item) => item.id.equals(id));
    return movement ?? null;
  }

  async findManyByItem(itemId: UniqueEntityID): Promise<ItemMovement[]> {
    return this.items.filter((movement) => movement.itemId.equals(itemId));
  }

  async findManyByUser(userId: UniqueEntityID): Promise<ItemMovement[]> {
    return this.items.filter((movement) => movement.userId.equals(userId));
  }

  async findManyByType(movementType: MovementType): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) => movement.movementType.value === movementType.value,
    );
  }

  async findManyByBatch(batchNumber: string): Promise<ItemMovement[]> {
    return this.items.filter(
      (movement) => movement.batchNumber === batchNumber,
    );
  }

  async findManyBySalesOrder(
    salesOrderId: UniqueEntityID,
  ): Promise<ItemMovement[]> {
    return this.items.filter((movement) =>
      movement.salesOrderId?.equals(salesOrderId),
    );
  }

  async findManyPendingApproval(): Promise<ItemMovement[]> {
    return this.items.filter((movement) => !movement.approvedBy);
  }

  async findAll(): Promise<ItemMovement[]> {
    return this.items;
  }

  async update(data: UpdateItemMovementSchema): Promise<ItemMovement | null> {
    const movement = await this.findById(data.id);
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
}
