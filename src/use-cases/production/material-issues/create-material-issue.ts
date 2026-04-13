import { MaterialIssuesRepository } from '@/repositories/production/material-issues-repository';

interface CreateMaterialIssueUseCaseRequest {
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: number;
  batchNumber?: string;
  issuedById: string;
  notes?: string;
}

interface CreateMaterialIssueUseCaseResponse {
  materialIssue: import('@/entities/production/material-issue').ProductionMaterialIssue;
}

export class CreateMaterialIssueUseCase {
  constructor(private materialIssuesRepository: MaterialIssuesRepository) {}

  async execute({
    productionOrderId,
    materialId,
    warehouseId,
    quantity,
    batchNumber,
    issuedById,
    notes,
  }: CreateMaterialIssueUseCaseRequest): Promise<CreateMaterialIssueUseCaseResponse> {
    const materialIssue = await this.materialIssuesRepository.create({
      productionOrderId,
      materialId,
      warehouseId,
      quantity,
      batchNumber,
      issuedById,
      notes,
    });

    return { materialIssue };
  }
}
