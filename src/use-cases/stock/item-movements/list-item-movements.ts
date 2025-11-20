import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
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
  movements: ItemMovementDTO[];
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
      // If no filters provided, return all movements
      movements = await this.itemMovementsRepository.findAll();
    }

    return {
      movements: movements.map(itemMovementToDTO),
    };
  }
}
