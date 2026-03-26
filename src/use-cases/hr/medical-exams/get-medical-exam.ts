import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam } from '@/entities/hr/medical-exam';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface GetMedicalExamRequest {
  tenantId: string;
  examId: string;
}

export interface GetMedicalExamResponse {
  medicalExam: MedicalExam;
}

export class GetMedicalExamUseCase {
  constructor(private medicalExamsRepository: MedicalExamsRepository) {}

  async execute(
    request: GetMedicalExamRequest,
  ): Promise<GetMedicalExamResponse> {
    const { tenantId, examId } = request;

    const medicalExam = await this.medicalExamsRepository.findById(
      new UniqueEntityID(examId),
      tenantId,
    );

    if (!medicalExam) {
      throw new ResourceNotFoundError('Exame médico não encontrado');
    }

    return { medicalExam };
  }
}
