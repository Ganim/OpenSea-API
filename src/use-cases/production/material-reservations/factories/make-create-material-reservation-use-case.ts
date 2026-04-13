import { PrismaMaterialReservationsRepository } from '@/repositories/production/prisma/prisma-material-reservations-repository';
import { CreateMaterialReservationUseCase } from '../create-material-reservation';

export function makeCreateMaterialReservationUseCase() {
  const materialReservationsRepository =
    new PrismaMaterialReservationsRepository();
  const createMaterialReservationUseCase = new CreateMaterialReservationUseCase(
    materialReservationsRepository,
  );
  return createMaterialReservationUseCase;
}
