import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type CostCenterDTO,
  costCenterToDTO,
} from '@/mappers/finance/cost-center/cost-center-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';

interface GetCostCenterByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetCostCenterByIdUseCaseResponse {
  costCenter: CostCenterDTO;
}

export class GetCostCenterByIdUseCase {
  constructor(private costCentersRepository: CostCentersRepository) {}

  async execute({ tenantId, id }: GetCostCenterByIdUseCaseRequest): Promise<GetCostCenterByIdUseCaseResponse> {
    const costCenter = await this.costCentersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!costCenter) {
      throw new ResourceNotFoundError('Cost center not found');
    }

    return { costCenter: costCenterToDTO(costCenter) };
  }
}
