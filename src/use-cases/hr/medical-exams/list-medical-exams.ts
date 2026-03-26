import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam } from '@/entities/hr/medical-exam';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface ListMedicalExamsRequest {
  tenantId: string;
  employeeId?: string;
  type?: string;
  result?: string;
  page?: number;
  perPage?: number;
}

export interface ListMedicalExamsResponse {
  medicalExams: MedicalExam[];
}

export class ListMedicalExamsUseCase {
  constructor(private medicalExamsRepository: MedicalExamsRepository) {}

  async execute(
    request: ListMedicalExamsRequest,
  ): Promise<ListMedicalExamsResponse> {
    const { tenantId, employeeId, type, result, page, perPage } = request;

    const medicalExams = await this.medicalExamsRepository.findMany(tenantId, {
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      type,
      result,
      page,
      perPage,
    });

    return { medicalExams };
  }
}
