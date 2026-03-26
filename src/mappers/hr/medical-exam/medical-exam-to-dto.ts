import type { MedicalExam } from '@/entities/hr/medical-exam';

export interface MedicalExamDTO {
  id: string;
  employeeId: string;
  type: string;
  examDate: string;
  expirationDate: string | null;
  doctorName: string;
  doctorCrm: string;
  result: string;
  observations: string | null;
  documentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function medicalExamToDTO(exam: MedicalExam): MedicalExamDTO {
  return {
    id: exam.id.toString(),
    employeeId: exam.employeeId.toString(),
    type: exam.type,
    examDate: exam.examDate.toISOString(),
    expirationDate: exam.expirationDate?.toISOString() ?? null,
    doctorName: exam.doctorName,
    doctorCrm: exam.doctorCrm,
    result: exam.result,
    observations: exam.observations ?? null,
    documentUrl: exam.documentUrl ?? null,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString(),
  };
}
