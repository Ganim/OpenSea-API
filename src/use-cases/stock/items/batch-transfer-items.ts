import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { BinsRepository } from '@/repositories/stock/bins-repository';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface BatchTransferItemsUseCaseRequest {
  tenantId: string;
  itemIds: string[];
  destinationBinId: string;
  userId: string;
  notes?: string;
}

interface BatchTransferItemsUseCaseResponse {
  transferred: number;
  movements: ItemMovementDTO[];
}

export class BatchTransferItemsUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private binsRepository: BinsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
  ) {}

  async execute(
    input: BatchTransferItemsUseCaseRequest,
  ): Promise<BatchTransferItemsUseCaseResponse> {
    if (input.itemIds.length === 0) {
      throw new BadRequestError('At least one item must be specified.');
    }

    if (input.itemIds.length > 100) {
      throw new BadRequestError('Maximum 100 items per batch transfer.');
    }

    if (input.notes && input.notes.length > 1000) {
      throw new BadRequestError('Notes cannot exceed 1000 characters.');
    }

    // Validate destination bin
    const destinationBin = await this.binsRepository.findById(
      new UniqueEntityID(input.destinationBinId),
      input.tenantId,
    );
    if (!destinationBin) {
      throw new ResourceNotFoundError('Destination bin not found.');
    }

    if (destinationBin.isBlocked) {
      throw new BadRequestError('Cannot transfer items to a blocked bin.');
    }

    const movements: ItemMovementDTO[] = [];
    const originBinIds = new Set<string>();

    for (const itemId of input.itemIds) {
      const item = await this.itemsRepository.findById(
        new UniqueEntityID(itemId),
        input.tenantId,
      );
      if (!item) {
        throw new ResourceNotFoundError(`Item ${itemId} not found.`);
      }

      // Skip if already in destination bin
      if (item.binId && item.binId.equals(destinationBin.binId)) {
        continue;
      }

      // Capture origin bin address
      let originAddress: string | undefined;
      if (item.binId) {
        const originBinId = item.binId.toString();
        originBinIds.add(originBinId);
        const originBin = await this.binsRepository.findById(
          item.binId,
          input.tenantId,
        );
        originAddress = originBin?.address;
      }

      // Update item
      item.binId = destinationBin.binId;
      item.lastKnownAddress = destinationBin.address;
      await this.itemsRepository.save(item);

      // Create transfer movement
      const movement = await this.itemMovementsRepository.create({
        tenantId: input.tenantId,
        itemId: item.id,
        userId: new UniqueEntityID(input.userId),
        quantity: item.currentQuantity,
        quantityBefore: item.currentQuantity,
        quantityAfter: item.currentQuantity,
        movementType: MovementType.create('TRANSFER'),
        originRef: originAddress ? `Bin: ${originAddress}` : undefined,
        destinationRef: `Bin: ${destinationBin.address}`,
        notes:
          input.notes || 'Batch transfer',
      });

      movements.push(itemMovementToDTO(movement));
    }

    // Auto-cleanup: check if any origin bins are blocked and now empty
    for (const originBinId of originBinIds) {
      const originBin = await this.binsRepository.findById(
        new UniqueEntityID(originBinId),
        input.tenantId,
      );
      if (originBin && originBin.isBlocked) {
        const binItemCount = await this.binsRepository.countItemsPerBin(
          originBin.zoneId,
          input.tenantId,
        );
        const remainingItems = binItemCount.get(originBinId) ?? 0;
        if (remainingItems === 0) {
          await this.binsRepository.softDeleteMany([originBinId]);
        }
      }
    }

    return {
      transferred: movements.length,
      movements,
    };
  }
}
