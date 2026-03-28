import type { TrainingEnrollment } from '@/entities/hr/training-enrollment';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingEnrollmentsRepository } from '@/repositories/hr/training-enrollments-repository';

export interface ListTrainingEnrollmentsRequest {
  tenantId: string;
  trainingProgramId?: string;
  employeeId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListTrainingEnrollmentsResponse {
  enrollments: TrainingEnrollment[];
  total: number;
}

export class ListTrainingEnrollmentsUseCase {
  constructor(
    private trainingEnrollmentsRepository: TrainingEnrollmentsRepository,
  ) {}

  async execute(
    request: ListTrainingEnrollmentsRequest,
  ): Promise<ListTrainingEnrollmentsResponse> {
    const { tenantId, trainingProgramId, employeeId, status, page, perPage } =
      request;

    const { enrollments, total } =
      await this.trainingEnrollmentsRepository.findMany(tenantId, {
        trainingProgramId: trainingProgramId
          ? new UniqueEntityID(trainingProgramId)
          : undefined,
        employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
        status,
        page,
        perPage,
      });

    return { enrollments, total };
  }
}
