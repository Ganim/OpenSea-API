import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';
import { LocationsRepository } from '@/repositories/stock/locations-repository';

interface TransferItemUseCaseRequest {
  itemId: string;
  destinationLocationId: string;
  userId: string;
  reasonCode?: string;
  notes?: string;
}

interface TransferItemUseCaseResponse {
  item: {
    id: string;
    uniqueCode: string;
    initialQuantity: number;
    currentQuantity: number;
    status: string;
    variantId: string;
    locationId: string;
    batchNumber: string | null;
    manufacturingDate: Date | null;
    expiryDate: Date | null;
    notes: string | null;
    attributes: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  };
  movement: {
    id: string;
    itemId: string;
    userId: string;
    quantity: number;
    quantityBefore: number | null;
    quantityAfter: number | null;
    movementType: string;
    reasonCode: string | null;
    destinationRef: string | null;
    notes: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    createdAt: Date;
  };
}

export class TransferItemUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private locationsRepository: LocationsRepository,
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
    );
    if (!item) {
      throw new ResourceNotFoundError('Item not found.');
    }

    // Validation: destination location must exist
    const destinationLocation = await this.locationsRepository.findById(
      new UniqueEntityID(input.destinationLocationId),
    );
    if (!destinationLocation) {
      throw new ResourceNotFoundError('Destination location not found.');
    }

    // Validation: destination must be different from current location
    if (item.locationId.equals(destinationLocation.id)) {
      throw new BadRequestError(
        'Destination location must be different from current location.',
      );
    }

    // Update item location
    item.locationId = destinationLocation.id;
    await this.itemsRepository.save(item);

    // Create transfer movement record
    const movement = await this.itemMovementsRepository.create({
      itemId: item.id,
      userId: new UniqueEntityID(input.userId),
      quantity: item.currentQuantity, // Transfer quantity is current quantity
      quantityBefore: item.currentQuantity,
      quantityAfter: item.currentQuantity, // Quantity doesn't change in transfer
      movementType: MovementType.create('TRANSFER'),
      reasonCode: input.reasonCode,
      destinationRef: `Location: ${destinationLocation.code}`,
      notes: input.notes,
    });

    return {
      item: {
        id: item.id.toString(),
        uniqueCode: item.uniqueCode,
        initialQuantity: item.initialQuantity,
        currentQuantity: item.currentQuantity,
        status: item.status.value,
        variantId: item.variantId.toString(),
        locationId: item.locationId.toString(),
        batchNumber: item.batchNumber ?? null,
        manufacturingDate: item.manufacturingDate ?? null,
        expiryDate: item.expiryDate ?? null,
        notes: null,
        attributes: item.attributes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt ?? item.createdAt,
      },
      movement: {
        id: movement.id.toString(),
        itemId: movement.itemId.toString(),
        userId: movement.userId.toString(),
        quantity: movement.quantity,
        quantityBefore: movement.quantityBefore ?? null,
        quantityAfter: movement.quantityAfter ?? null,
        movementType: movement.movementType.value,
        reasonCode: movement.reasonCode ?? null,
        destinationRef: movement.destinationRef ?? null,
        notes: movement.notes ?? null,
        approvedBy: movement.approvedBy?.toString() ?? null,
        approvedAt: null,
        createdAt: movement.createdAt,
      },
    };
  }
}
