import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MaterialReservationsRepository } from '@/repositories/production/material-reservations-repository';

interface CancelMaterialReservationUseCaseRequest {
  reservationId: string;
}

interface CancelMaterialReservationUseCaseResponse {
  materialReservation: import('@/entities/production/material-reservation').ProductionMaterialReservation;
}

export class CancelMaterialReservationUseCase {
  constructor(
    private materialReservationsRepository: MaterialReservationsRepository,
  ) {}

  async execute({
    reservationId,
  }: CancelMaterialReservationUseCaseRequest): Promise<CancelMaterialReservationUseCaseResponse> {
    const existingReservation =
      await this.materialReservationsRepository.findById(
        new UniqueEntityID(reservationId),
      );

    if (!existingReservation) {
      throw new ResourceNotFoundError('Material reservation not found.');
    }

    if (existingReservation.status === 'CANCELLED') {
      throw new BadRequestError('Material reservation is already cancelled.');
    }

    if (existingReservation.status === 'FULLY_ISSUED') {
      throw new BadRequestError('Cannot cancel a fully issued material reservation.');
    }

    const materialReservation =
      await this.materialReservationsRepository.update({
        id: new UniqueEntityID(reservationId),
        status: 'CANCELLED',
      });

    if (!materialReservation) {
      throw new BadRequestError('Failed to cancel material reservation.');
    }

    return { materialReservation };
  }
}
