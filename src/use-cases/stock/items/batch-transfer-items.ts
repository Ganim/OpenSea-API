import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { TransactionManager } from '@/lib/transaction-manager';
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
    private transactionManager?: TransactionManager,
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

    // Wrap all mutations in a transaction to prevent partial transfers
    const doTransfer = async () => {
      return this.performTransfer(input, destinationBin);
    };

    if (this.transactionManager) {
      return this.transactionManager.run(() => doTransfer());
    }
    return doTransfer();
  }

  private async performTransfer(
    input: BatchTransferItemsUseCaseRequest,
    destinationBin: { binId: UniqueEntityID; address: string; isBlocked: boolean },
  ): Promise<BatchTransferItemsUseCaseResponse> {
    // Batch-load all items upfront (N+1 → 1 query)
    const items = await this.itemsRepository.findManyByIds(
      input.itemIds.map((id) => new UniqueEntityID(id)),
      input.tenantId,
    );

    const itemsMap = new Map(items.map((item) => [item.id.toString(), item]));

    // Validate all items exist
    for (const itemId of input.itemIds) {
      if (!itemsMap.has(itemId)) {
        throw new ResourceNotFoundError(`Item ${itemId} not found.`);
      }
    }

    // Collect origin bin IDs for batch loading
    const originBinIdSet = new Set<string>();
    for (const item of items) {
      if (item.binId && !item.binId.equals(destinationBin.binId)) {
        originBinIdSet.add(item.binId.toString());
      }
    }

    // Batch-load all origin bins (N+1 → 1 query)
    const originBins = originBinIdSet.size > 0
      ? await this.binsRepository.findManyByIds(
          [...originBinIdSet].map((id) => new UniqueEntityID(id)),
          input.tenantId,
        )
      : [];
    const originBinsMap = new Map(
      originBins.map((bin) => [bin.binId.toString(), bin]),
    );

    const movements: ItemMovementDTO[] = [];

    for (const itemId of input.itemIds) {
      const item = itemsMap.get(itemId)!;

      // Skip if already in destination bin
      if (item.binId && item.binId.equals(destinationBin.binId)) {
        continue;
      }

      // Resolve origin bin address from pre-fetched map
      const originAddress = item.binId
        ? originBinsMap.get(item.binId.toString())?.address
        : undefined;

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
        notes: input.notes || 'Batch transfer',
      });

      movements.push(itemMovementToDTO(movement));
    }

    // Auto-cleanup: check if any origin bins are blocked and now empty
    // Batch-load origin bins for cleanup (reuse pre-fetched data)
    for (const originBinId of originBinIdSet) {
      const originBin = originBinsMap.get(originBinId);
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
