import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemReservation } from '@/entities/sales/item-reservation';
import { ItemReservationsRepository } from '@/repositories/sales/item-reservations-repository';

interface ReleaseItemReservationRequest {
  id: string;
}

interface ReleaseItemReservationResponse {
  reservation: ItemReservation;
}

export class ReleaseItemReservationUseCase {
  constructor(private itemReservationsRepository: ItemReservationsRepository) {}

  async execute(
    request: ReleaseItemReservationRequest,
  ): Promise<ReleaseItemReservationResponse> {
    const { id } = request;

    const reservation = await this.itemReservationsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!reservation) {
      throw new ResourceNotFoundError('Reservation not found');
    }

    if (reservation.isReleased) {
      throw new BadRequestError('Reservation already released');
    }

    reservation.release();
    await this.itemReservationsRepository.save(reservation);

    return { reservation };
  }
}
