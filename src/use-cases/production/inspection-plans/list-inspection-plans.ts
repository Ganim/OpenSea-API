import { InspectionPlansRepository } from '@/repositories/production/inspection-plans-repository';

interface ListInspectionPlansUseCaseRequest {
  operationRoutingId: string;
}

interface ListInspectionPlansUseCaseResponse {
  inspectionPlans: import('@/entities/production/inspection-plan').ProductionInspectionPlan[];
}

export class ListInspectionPlansUseCase {
  constructor(private inspectionPlansRepository: InspectionPlansRepository) {}

  async execute({
    operationRoutingId,
  }: ListInspectionPlansUseCaseRequest): Promise<ListInspectionPlansUseCaseResponse> {
    const inspectionPlans =
      await this.inspectionPlansRepository.findManyByOperationRoutingId(
        operationRoutingId,
      );

    return { inspectionPlans };
  }
}
