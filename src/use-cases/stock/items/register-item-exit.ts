import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface RegisterItemExitUseCaseRequest {
  tenantId: string;
  itemId: string;
  quantity: number;
  userId: string;
  movementType: 'SALE' | 'PRODUCTION' | 'SAMPLE' | 'LOSS';
  reasonCode?: string;
  destinationRef?: string;
  notes?: string;
}

interface RegisterItemExitUseCaseResponse {
  item: ItemDTO;
  movement: ItemMovementDTO;
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
      input.tenantId,
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
      tenantId: input.tenantId,
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
      item: itemToDTO(item),
      movement: itemMovementToDTO(movement),
    };
  }
}
