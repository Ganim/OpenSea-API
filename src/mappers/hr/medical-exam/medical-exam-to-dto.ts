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
  // PCMSO fields
  examCategory: string | null;
  validityMonths: number | null;
  clinicName: string | null;
  clinicAddress: string | null;
  physicianName: string | null;
  physicianCRM: string | null;
  aptitude: string | null;
  restrictions: string | null;
  nextExamDate: string | null;
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
    // PCMSO fields
    examCategory: exam.examCategory ?? null,
    validityMonths: exam.validityMonths ?? null,
    clinicName: exam.clinicName ?? null,
    clinicAddress: exam.clinicAddress ?? null,
    physicianName: exam.physicianName ?? null,
    physicianCRM: exam.physicianCRM ?? null,
    aptitude: exam.aptitude ?? null,
    restrictions: exam.restrictions ?? null,
    nextExamDate: exam.nextExamDate?.toISOString() ?? null,
    createdAt: exam.createdAt.toISOString(),
    updatedAt: exam.updatedAt.toISOString(),
  };
}
