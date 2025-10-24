import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  itemReservationToDTO,
  type ItemReservationDTO,
} from '@/mappers/sales/item-reservation/item-reservation-to-dto';
import { ItemReservationsRepository } from '@/repositories/sales/item-reservations-repository';

interface ListItemReservationsRequest {
  itemId?: string;
  userId?: string;
  activeOnly?: boolean;
}

interface ListItemReservationsResponse {
  reservations: ItemReservationDTO[];
}

export class ListItemReservationsUseCase {
  constructor(private itemReservationsRepository: ItemReservationsRepository) {}

  async execute(
    request: ListItemReservationsRequest,
  ): Promise<ListItemReservationsResponse> {
    const { itemId, userId, activeOnly } = request;

    let reservations: Awaited<
      ReturnType<ItemReservationsRepository['findManyActive']>
    >;

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

    return { reservations: reservations.map(itemReservationToDTO) };
  }
}
