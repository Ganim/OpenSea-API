import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionMaterialReservation } from '@/entities/production/material-reservation';
import { MaterialReservationsRepository } from '@/repositories/production/material-reservations-repository';

interface ListMaterialReservationsUseCaseRequest {
  productionOrderId: string;
}

interface ListMaterialReservationsUseCaseResponse {
  materialReservations: ProductionMaterialReservation[];
}

export class ListMaterialReservationsUseCase {
  constructor(
    private materialReservationsRepository: MaterialReservationsRepository,
  ) {}

  async execute({
    productionOrderId,
  }: ListMaterialReservationsUseCaseRequest): Promise<ListMaterialReservationsUseCaseResponse> {
    const materialReservations =
      await this.materialReservationsRepository.findManyByProductionOrderId(
        new UniqueEntityID(productionOrderId),
      );

    return { materialReservations };
  }
}
