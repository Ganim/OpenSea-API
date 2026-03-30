import type { MedicalExam } from '@/entities/hr/medical-exam';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface ListExpiringExamsRequest {
  tenantId: string;
  daysThreshold?: number;
}

export interface ListExpiringExamsResponse {
  expiringExams: MedicalExam[];
}

export class ListExpiringExamsUseCase {
  constructor(private medicalExamsRepository: MedicalExamsRepository) {}

  async execute(
    request: ListExpiringExamsRequest,
  ): Promise<ListExpiringExamsResponse> {
    const { tenantId, daysThreshold = 30 } = request;

    const expiringExams = await this.medicalExamsRepository.findExpiring(
      tenantId,
      daysThreshold,
    );

    return { expiringExams };
  }
}
