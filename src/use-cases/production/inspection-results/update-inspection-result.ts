import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  InspectionStatus,
  ProductionInspectionResult,
} from '@/entities/production/inspection-result';
import { InspectionResultsRepository } from '@/repositories/production/inspection-results-repository';

interface UpdateInspectionResultUseCaseRequest {
  inspectionResultId: string;
  status?: InspectionStatus;
  defectsFound?: number;
  notes?: string | null;
}

interface UpdateInspectionResultUseCaseResponse {
  inspectionResult: ProductionInspectionResult;
}

export class UpdateInspectionResultUseCase {
  constructor(
    private inspectionResultsRepository: InspectionResultsRepository,
  ) {}

  async execute({
    inspectionResultId,
    status,
    defectsFound,
    notes,
  }: UpdateInspectionResultUseCaseRequest): Promise<UpdateInspectionResultUseCaseResponse> {
    const existingResult = await this.inspectionResultsRepository.findById(
      new UniqueEntityID(inspectionResultId),
    );

    if (!existingResult) {
      throw new Error('Inspection result not found');
    }

    const inspectionResult = await this.inspectionResultsRepository.update({
      id: new UniqueEntityID(inspectionResultId),
      status,
      defectsFound,
      notes,
    });

    if (!inspectionResult) {
      throw new Error('Failed to update inspection result');
    }

    return { inspectionResult };
  }
}
