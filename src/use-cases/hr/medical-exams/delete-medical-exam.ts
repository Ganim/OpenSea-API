import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam } from '@/entities/hr/medical-exam';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface DeleteMedicalExamRequest {
  tenantId: string;
  examId: string;
}

export interface DeleteMedicalExamResponse {
  medicalExam: MedicalExam;
}

export class DeleteMedicalExamUseCase {
  constructor(private medicalExamsRepository: MedicalExamsRepository) {}

  async execute(
    request: DeleteMedicalExamRequest,
  ): Promise<DeleteMedicalExamResponse> {
    const { tenantId, examId } = request;

    const medicalExam = await this.medicalExamsRepository.findById(
      new UniqueEntityID(examId),
      tenantId,
    );

    if (!medicalExam) {
      throw new ResourceNotFoundError('Exame médico não encontrado');
    }

    await this.medicalExamsRepository.delete(new UniqueEntityID(examId));

    return { medicalExam };
  }
}
