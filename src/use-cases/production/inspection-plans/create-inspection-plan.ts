import { InspectionPlansRepository } from '@/repositories/production/inspection-plans-repository';

interface CreateInspectionPlanUseCaseRequest {
  operationRoutingId: string;
  inspectionType: string;
  description?: string;
  sampleSize: number;
  aqlLevel?: string;
  instructions?: string;
  isActive?: boolean;
}

interface CreateInspectionPlanUseCaseResponse {
  inspectionPlan: import('@/entities/production/inspection-plan').ProductionInspectionPlan;
}

export class CreateInspectionPlanUseCase {
  constructor(
    private inspectionPlansRepository: InspectionPlansRepository,
  ) {}

  async execute({
    operationRoutingId,
    inspectionType,
    description,
    sampleSize,
    aqlLevel,
    instructions,
    isActive,
  }: CreateInspectionPlanUseCaseRequest): Promise<CreateInspectionPlanUseCaseResponse> {
    const inspectionPlan = await this.inspectionPlansRepository.create({
      operationRoutingId,
      inspectionType,
      description,
      sampleSize,
      aqlLevel,
      instructions,
      isActive,
    });

    return { inspectionPlan };
  }
}
