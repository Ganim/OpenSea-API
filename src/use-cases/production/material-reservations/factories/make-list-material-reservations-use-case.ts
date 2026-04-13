import { PrismaMaterialReservationsRepository } from '@/repositories/production/prisma/prisma-material-reservations-repository';
import { ListMaterialReservationsUseCase } from '../list-material-reservations';

export function makeListMaterialReservationsUseCase() {
  const materialReservationsRepository =
    new PrismaMaterialReservationsRepository();
  const listMaterialReservationsUseCase = new ListMaterialReservationsUseCase(
    materialReservationsRepository,
  );
  return listMaterialReservationsUseCase;
}
