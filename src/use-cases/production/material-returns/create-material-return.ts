import { MaterialReturnsRepository } from '@/repositories/production/material-returns-repository';

interface CreateMaterialReturnUseCaseRequest {
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  reason?: string;
  returnedById: string;
}

interface CreateMaterialReturnUseCaseResponse {
  materialReturn: import('@/entities/production/material-return').ProductionMaterialReturn;
}

export class CreateMaterialReturnUseCase {
  constructor(private materialReturnsRepository: MaterialReturnsRepository) {}

  async execute({
    productionOrderId,
    materialId,
    warehouseId,
    quantity,
    reason,
    returnedById,
  }: CreateMaterialReturnUseCaseRequest): Promise<CreateMaterialReturnUseCaseResponse> {
    const materialReturn = await this.materialReturnsRepository.create({
      productionOrderId,
      materialId,
      warehouseId,
      quantity,
      reason,
      returnedById,
    });

    return { materialReturn };
  }
}
