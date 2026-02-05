import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { BinsRepository } from '@/repositories/stock/bins-repository';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface TransferItemUseCaseRequest {
  tenantId: string;
  itemId: string;
  destinationBinId: string;
  userId: string;
  reasonCode?: string;
  notes?: string;
}

interface TransferItemUseCaseResponse {
  item: ItemDTO;
  movement: ItemMovementDTO;
}

export class TransferItemUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private binsRepository: BinsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
  ) {}

  async execute(
    input: TransferItemUseCaseRequest,
  ): Promise<TransferItemUseCaseResponse> {
    // Validation: reasonCode max length 64
    if (input.reasonCode && input.reasonCode.length > 64) {
      throw new BadRequestError('Reason code cannot exceed 64 characters.');
    }

    // Validation: notes max length 1000
    if (input.notes && input.notes.length > 1000) {
      throw new BadRequestError('Notes cannot exceed 1000 characters.');
    }

    // Validation: item must exist
    const item = await this.itemsRepository.findById(
      new UniqueEntityID(input.itemId),
      input.tenantId,
    );
    if (!item) {
      throw new ResourceNotFoundError('Item not found.');
    }

    // Validation: destination bin must exist
    const destinationBin = await this.binsRepository.findById(
      new UniqueEntityID(input.destinationBinId),
      input.tenantId,
    );
    if (!destinationBin) {
      throw new ResourceNotFoundError('Destination bin not found.');
    }

    // Validation: destination must be different from current bin
    if (item.binId && item.binId.equals(destinationBin.binId)) {
      throw new BadRequestError(
        'Destination bin must be different from current bin.',
      );
    }

    // Capture origin bin address before updating
    let originAddress: string | undefined;
    if (item.binId) {
      const originBin = await this.binsRepository.findById(item.binId, input.tenantId);
      originAddress = originBin?.address;
    }

    // Update item bin and last known address
    item.binId = destinationBin.binId;
    item.lastKnownAddress = destinationBin.address;
    await this.itemsRepository.save(item);

    // Create transfer movement record
    const movement = await this.itemMovementsRepository.create({
      tenantId: input.tenantId,
      itemId: item.id,
      userId: new UniqueEntityID(input.userId),
      quantity: item.currentQuantity, // Transfer quantity is current quantity
      quantityBefore: item.currentQuantity,
      quantityAfter: item.currentQuantity, // Quantity doesn't change in transfer
      movementType: MovementType.create('TRANSFER'),
      reasonCode: input.reasonCode,
      originRef: originAddress ? `Bin: ${originAddress}` : undefined,
      destinationRef: `Bin: ${destinationBin.address}`,
      notes: input.notes,
    });

    return {
      item: itemToDTO(item),
      movement: itemMovementToDTO(movement),
    };
  }
}
