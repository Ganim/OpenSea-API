import type { MedicalExam } from '@/entities/hr/medical-exam';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface ListOverdueExamsRequest {
  tenantId: string;
}

export interface ListOverdueExamsResponse {
  overdueExams: MedicalExam[];
}

export class ListOverdueExamsUseCase {
  constructor(private medicalExamsRepository: MedicalExamsRepository) {}

  async execute(
    request: ListOverdueExamsRequest,
  ): Promise<ListOverdueExamsResponse> {
    const { tenantId } = request;

    const overdueExams =
      await this.medicalExamsRepository.findOverdue(tenantId);

    return { overdueExams };
  }
}
