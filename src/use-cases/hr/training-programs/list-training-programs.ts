import type { TrainingProgram } from '@/entities/hr/training-program';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';

export interface ListTrainingProgramsRequest {
  tenantId: string;
  category?: string;
  format?: string;
  isActive?: boolean;
  isMandatory?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ListTrainingProgramsResponse {
  trainingPrograms: TrainingProgram[];
  total: number;
}

export class ListTrainingProgramsUseCase {
  constructor(private trainingProgramsRepository: TrainingProgramsRepository) {}

  async execute(
    request: ListTrainingProgramsRequest,
  ): Promise<ListTrainingProgramsResponse> {
    const {
      tenantId,
      category,
      format,
      isActive,
      isMandatory,
      search,
      page,
      perPage,
    } = request;

    const { trainingPrograms, total } =
      await this.trainingProgramsRepository.findMany(tenantId, {
        category,
        format,
        isActive,
        isMandatory,
        search,
        page,
        perPage,
      });

    return { trainingPrograms, total };
  }
}
