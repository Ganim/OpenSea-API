import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionMaterialIssue } from '@/entities/production/material-issue';
import { MaterialIssuesRepository } from '@/repositories/production/material-issues-repository';

interface ListMaterialIssuesUseCaseRequest {
  productionOrderId: string;
}

interface ListMaterialIssuesUseCaseResponse {
  materialIssues: ProductionMaterialIssue[];
}

export class ListMaterialIssuesUseCase {
  constructor(private materialIssuesRepository: MaterialIssuesRepository) {}

  async execute({
    productionOrderId,
  }: ListMaterialIssuesUseCaseRequest): Promise<ListMaterialIssuesUseCaseResponse> {
    const materialIssues =
      await this.materialIssuesRepository.findManyByProductionOrderId(
        new UniqueEntityID(productionOrderId),
      );

    return { materialIssues };
  }
}
