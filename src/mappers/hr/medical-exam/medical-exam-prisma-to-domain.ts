import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExam as PrismaMedicalExam } from '@prisma/generated/client.js';

export function mapMedicalExamPrismaToDomain(exam: PrismaMedicalExam) {
  return {
    tenantId: new UniqueEntityID(exam.tenantId),
    employeeId: new UniqueEntityID(exam.employeeId),
    type: exam.type as
      | 'ADMISSIONAL'
      | 'PERIODICO'
      | 'MUDANCA_FUNCAO'
      | 'RETORNO'
      | 'DEMISSIONAL',
    examDate: exam.examDate,
    expirationDate: exam.expirationDate ?? undefined,
    doctorName: exam.doctorName,
    doctorCrm: exam.doctorCrm,
    result: exam.result as 'APTO' | 'INAPTO' | 'APTO_COM_RESTRICOES',
    observations: exam.observations ?? undefined,
    documentUrl: exam.documentUrl ?? undefined,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  };
}
