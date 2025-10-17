import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';

interface ListItemMovementsRequest {
  itemId?: string;
  userId?: string;
  movementType?: string;
  salesOrderId?: string;
  batchNumber?: string;
  pendingApproval?: boolean;
}

interface ListItemMovementsResponse {
  movements: Array<{
    id: string;
    itemId: string;
    userId: string;
    quantity: number;
    quantityBefore: number | null;
    quantityAfter: number | null;
    movementType: string;
    reasonCode: string | null;
    destinationRef: string | null;
    batchNumber: string | null;
    notes: string | null;
    approvedBy: string | null;
    salesOrderId: string | null;
    createdAt: Date;
  }>;
}

export class ListItemMovementsUseCase {
  constructor(private itemMovementsRepository: ItemMovementsRepository) {}

  async execute(
    input: ListItemMovementsRequest = {},
  ): Promise<ListItemMovementsResponse> {
    let movements: ItemMovement[] = [];

    // Fetch movements based on filters
    if (input.pendingApproval) {
      movements = await this.itemMovementsRepository.findManyPendingApproval();
    } else if (input.itemId) {
      movements = await this.itemMovementsRepository.findManyByItem(
        new UniqueEntityID(input.itemId),
      );
    } else if (input.userId) {
      movements = await this.itemMovementsRepository.findManyByUser(
        new UniqueEntityID(input.userId),
      );
    } else if (input.movementType) {
      movements = await this.itemMovementsRepository.findManyByType(
        MovementType.create(
          input.movementType as
            | 'SALE'
            | 'PRODUCTION'
            | 'SAMPLE'
            | 'LOSS'
            | 'TRANSFER'
            | 'INVENTORY_ADJUSTMENT',
        ),
      );
    } else if (input.salesOrderId) {
      movements = await this.itemMovementsRepository.findManyBySalesOrder(
        new UniqueEntityID(input.salesOrderId),
      );
    } else if (input.batchNumber) {
      movements = await this.itemMovementsRepository.findManyByBatch(
        input.batchNumber,
      );
    } else {
      // If no filters provided, return empty array
      movements = [];
    }

    return {
      movements: movements.map((movement) => ({
        id: movement.id.toString(),
        itemId: movement.itemId.toString(),
        userId: movement.userId.toString(),
        quantity: movement.quantity,
        quantityBefore: movement.quantityBefore ?? null,
        quantityAfter: movement.quantityAfter ?? null,
        movementType: movement.movementType.value,
        reasonCode: movement.reasonCode ?? null,
        destinationRef: movement.destinationRef ?? null,
        batchNumber: movement.batchNumber ?? null,
        notes: movement.notes ?? null,
        approvedBy: movement.approvedBy?.toString() ?? null,
        salesOrderId: movement.salesOrderId?.toString() ?? null,
        createdAt: movement.createdAt,
      })),
    };
  }
}
