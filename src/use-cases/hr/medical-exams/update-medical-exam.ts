import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam } from '@/entities/hr/medical-exam';
import { MedicalExamsRepository } from '@/repositories/hr/medical-exams-repository';

export interface UpdateMedicalExamRequest {
  tenantId: string;
  examId: string;
  type?: string;
  examDate?: Date;
  expirationDate?: Date;
  doctorName?: string;
  doctorCrm?: string;
  result?: string;
  observations?: string;
  documentUrl?: string;
}

export interface UpdateMedicalExamResponse {
  medicalExam: MedicalExam;
}

export class UpdateMedicalExamUseCase {
  constructor(private medicalExamsRepository: MedicalExamsRepository) {}

  async execute(
    request: UpdateMedicalExamRequest,
  ): Promise<UpdateMedicalExamResponse> {
    const { tenantId, examId, ...data } = request;

    const existing = await this.medicalExamsRepository.findById(
      new UniqueEntityID(examId),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Exame médico não encontrado');
    }

    const medicalExam = await this.medicalExamsRepository.update({
      id: new UniqueEntityID(examId),
      type: data.type,
      examDate: data.examDate,
      expirationDate: data.expirationDate,
      doctorName: data.doctorName?.trim(),
      doctorCrm: data.doctorCrm?.trim(),
      result: data.result,
      observations: data.observations?.trim(),
      documentUrl: data.documentUrl,
    });

    if (!medicalExam) {
      throw new ResourceNotFoundError('Exame médico não encontrado');
    }

    return { medicalExam };
  }
}
