import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkCentersRepository } from '@/repositories/production/work-centers-repository';

interface GetWorkCenterByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetWorkCenterByIdUseCaseResponse {
  workCenter: import('@/entities/production/work-center').ProductionWorkCenter;
}

export class GetWorkCenterByIdUseCase {
  constructor(private workCentersRepository: WorkCentersRepository) {}

  async execute({
    tenantId,
    id,
  }: GetWorkCenterByIdUseCaseRequest): Promise<GetWorkCenterByIdUseCaseResponse> {
    const workCenter = await this.workCentersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!workCenter) {
      throw new ResourceNotFoundError('Work center not found.');
    }

    return {
      workCenter,
    };
  }
}
