import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemReservation } from '@/entities/sales/item-reservation';
import { ItemReservationsRepository } from '@/repositories/sales/item-reservations-repository';

interface ListItemReservationsRequest {
  itemId?: string;
  userId?: string;
  activeOnly?: boolean;
}

interface ListItemReservationsResponse {
  reservations: ItemReservation[];
}

export class ListItemReservationsUseCase {
  constructor(private itemReservationsRepository: ItemReservationsRepository) {}

  async execute(
    request: ListItemReservationsRequest,
  ): Promise<ListItemReservationsResponse> {
    const { itemId, userId, activeOnly } = request;

    let reservations: ItemReservation[];

    if (itemId && activeOnly) {
      reservations = await this.itemReservationsRepository.findManyActive(
        new UniqueEntityID(itemId),
      );
    } else if (itemId) {
      reservations = await this.itemReservationsRepository.findManyByItem(
        new UniqueEntityID(itemId),
      );
    } else if (userId) {
      reservations = await this.itemReservationsRepository.findManyByUser(
        new UniqueEntityID(userId),
      );
    } else {
      reservations = [];
    }

    return { reservations };
  }
}
