import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionMaterialReturn } from '@/entities/production/material-return';
import { MaterialReturnsRepository } from '@/repositories/production/material-returns-repository';

interface ListMaterialReturnsUseCaseRequest {
  productionOrderId: string;
}

interface ListMaterialReturnsUseCaseResponse {
  materialReturns: ProductionMaterialReturn[];
}

export class ListMaterialReturnsUseCase {
  constructor(private materialReturnsRepository: MaterialReturnsRepository) {}

  async execute({
    productionOrderId,
  }: ListMaterialReturnsUseCaseRequest): Promise<ListMaterialReturnsUseCaseResponse> {
    const materialReturns =
      await this.materialReturnsRepository.findManyByProductionOrderId(
        new UniqueEntityID(productionOrderId),
      );

    return { materialReturns };
  }
}
