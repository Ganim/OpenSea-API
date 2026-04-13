import { MaterialReservationsRepository } from '@/repositories/production/material-reservations-repository';

interface CreateMaterialReservationUseCaseRequest {
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantityReserved: number;
}

interface CreateMaterialReservationUseCaseResponse {
  materialReservation: import('@/entities/production/material-reservation').ProductionMaterialReservation;
}

export class CreateMaterialReservationUseCase {
  constructor(
    private materialReservationsRepository: MaterialReservationsRepository,
  ) {}

  async execute({
    productionOrderId,
    materialId,
    warehouseId,
    quantityReserved,
  }: CreateMaterialReservationUseCaseRequest): Promise<CreateMaterialReservationUseCaseResponse> {
    const materialReservation =
      await this.materialReservationsRepository.create({
        productionOrderId,
        materialId,
        warehouseId,
        quantityReserved,
      });

    return { materialReservation };
  }
}
