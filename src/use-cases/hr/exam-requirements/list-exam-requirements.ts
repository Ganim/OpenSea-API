import type { OccupationalExamRequirement } from '@/entities/hr/occupational-exam-requirement';
import { OccupationalExamRequirementsRepository } from '@/repositories/hr/occupational-exam-requirements-repository';

export interface ListExamRequirementsRequest {
  tenantId: string;
  positionId?: string;
  examCategory?: string;
  page?: number;
  perPage?: number;
}

export interface ListExamRequirementsResponse {
  examRequirements: OccupationalExamRequirement[];
}

export class ListExamRequirementsUseCase {
  constructor(
    private examRequirementsRepository: OccupationalExamRequirementsRepository,
  ) {}

  async execute(
    request: ListExamRequirementsRequest,
  ): Promise<ListExamRequirementsResponse> {
    const { tenantId, positionId, examCategory, page, perPage } = request;

    const examRequirements = await this.examRequirementsRepository.findMany(
      tenantId,
      { positionId, examCategory, page, perPage },
    );

    return { examRequirements };
  }
}
