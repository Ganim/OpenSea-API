import { PrismaMaterialReservationsRepository } from '@/repositories/production/prisma/prisma-material-reservations-repository';
import { CancelMaterialReservationUseCase } from '../cancel-material-reservation';

export function makeCancelMaterialReservationUseCase() {
  const materialReservationsRepository =
    new PrismaMaterialReservationsRepository();
  const cancelMaterialReservationUseCase = new CancelMaterialReservationUseCase(
    materialReservationsRepository,
  );
  return cancelMaterialReservationUseCase;
}
