import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface RegisterItemExitUseCaseRequest {
  itemId: string;
  quantity: number;
  userId: string;
  movementType: 'SALE' | 'PRODUCTION' | 'SAMPLE' | 'LOSS';
  reasonCode?: string;
  destinationRef?: string;
  notes?: string;
}

interface RegisterItemExitUseCaseResponse {
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

export class RegisterItemExitUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
  ) {}

  async execute(
    input: RegisterItemExitUseCaseRequest,
  ): Promise<RegisterItemExitUseCaseResponse> {
    // Validation: quantity must be positive
    if (input.quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than zero.');
    }

    // Validation: reasonCode max length 64
    if (input.reasonCode && input.reasonCode.length > 64) {
      throw new BadRequestError('Reason code cannot exceed 64 characters.');
    }

    // Validation: destinationRef max length 256
    if (input.destinationRef && input.destinationRef.length > 256) {
      throw new BadRequestError(
        'Destination reference cannot exceed 256 characters.',
      );
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

    // Validation: sufficient quantity available
    const quantityBefore = item.currentQuantity;
    if (quantityBefore < input.quantity) {
      throw new BadRequestError(
        `Insufficient quantity available. Current: ${quantityBefore}, Requested: ${input.quantity}`,
      );
    }

    // Update item quantity
    const quantityAfter = quantityBefore - input.quantity;
    item.currentQuantity = quantityAfter;

    // If quantity becomes zero, optionally update status (business logic decision)
    // For now, we'll leave the status as-is - you can add logic here if needed
    // if (quantityAfter === 0) {
    //   item.status = ItemStatus.create('RESERVED'); // or another status
    // }

    await this.itemsRepository.save(item);

    // Create movement record
    const movement = await this.itemMovementsRepository.create({
      itemId: item.id,
      userId: new UniqueEntityID(input.userId),
      quantity: input.quantity,
      quantityBefore,
      quantityAfter,
      movementType: MovementType.create(input.movementType),
      reasonCode: input.reasonCode,
      destinationRef: input.destinationRef,
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
        notes: null, // Item doesn't have notes field
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
        approvedAt: null, // ItemMovement doesn't have approvedAt field
        createdAt: movement.createdAt,
      },
    };
  }
}
