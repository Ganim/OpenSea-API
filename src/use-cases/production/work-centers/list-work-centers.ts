import { WorkCentersRepository } from '@/repositories/production/work-centers-repository';

interface ListWorkCentersUseCaseRequest {
  tenantId: string;
}

interface ListWorkCentersUseCaseResponse {
  workCenters: import('@/entities/production/work-center').ProductionWorkCenter[];
}

export class ListWorkCentersUseCase {
  constructor(private workCentersRepository: WorkCentersRepository) {}

  async execute({
    tenantId,
  }: ListWorkCentersUseCaseRequest): Promise<ListWorkCentersUseCaseResponse> {
    const workCenters = await this.workCentersRepository.findMany(tenantId);

    return {
      workCenters,
    };
  }
}
