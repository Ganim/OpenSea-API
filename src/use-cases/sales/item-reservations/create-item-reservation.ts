import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemReservation } from '@/entities/sales/item-reservation';
import { ItemReservationsRepository } from '@/repositories/sales/item-reservations-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';

interface CreateItemReservationRequest {
  itemId: string;
  userId: string;
  quantity: number;
  reason?: string;
  reference?: string;
  expiresAt: Date;
}

interface CreateItemReservationResponse {
  reservation: ItemReservation;
}

export class CreateItemReservationUseCase {
  constructor(
    private itemReservationsRepository: ItemReservationsRepository,
    private itemsRepository: ItemsRepository,
  ) {}

  async execute(
    request: CreateItemReservationRequest,
  ): Promise<CreateItemReservationResponse> {
    const { itemId, userId, quantity, reason, reference, expiresAt } = request;

    // Validate quantity
    if (quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than zero');
    }

    // Validate expiration date
    if (expiresAt <= new Date()) {
      throw new BadRequestError('Expiration date must be in the future');
    }

    // Validate item exists
    const item = await this.itemsRepository.findById(
      new UniqueEntityID(itemId),
    );
    if (!item) {
      throw new ResourceNotFoundError('Item not found');
    }

    // Check if item has enough available quantity
    const activeReservations =
      await this.itemReservationsRepository.findManyActive(
        new UniqueEntityID(itemId),
      );
    const reservedQuantity = activeReservations.reduce(
      (sum, r) => sum + r.quantity,
      0,
    );
    const availableQuantity = item.currentQuantity - reservedQuantity;

    if (quantity > availableQuantity) {
      throw new BadRequestError(
        `Insufficient available quantity. Available: ${availableQuantity}, Requested: ${quantity}`,
      );
    }

    // Create reservation
    const reservation = await this.itemReservationsRepository.create({
      itemId: new UniqueEntityID(itemId),
      userId: new UniqueEntityID(userId),
      quantity,
      reason: reason?.trim(),
      reference: reference?.trim(),
      expiresAt,
    });

    return { reservation };
  }
}
