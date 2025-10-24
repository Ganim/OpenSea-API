import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  itemReservationToDTO,
  type ItemReservationDTO,
} from '@/mappers/sales/item-reservation/item-reservation-to-dto';
import { ItemReservationsRepository } from '@/repositories/sales/item-reservations-repository';

interface GetItemReservationByIdRequest {
  id: string;
}

interface GetItemReservationByIdResponse {
  reservation: ItemReservationDTO;
}

export class GetItemReservationByIdUseCase {
  constructor(private itemReservationsRepository: ItemReservationsRepository) {}

  async execute(
    request: GetItemReservationByIdRequest,
  ): Promise<GetItemReservationByIdResponse> {
    const { id } = request;

    const reservation = await this.itemReservationsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!reservation) {
      throw new ResourceNotFoundError('Reservation not found');
    }

    return { reservation: itemReservationToDTO(reservation) };
  }
}
