import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  MedicalExamType,
  MedicalExamResult,
  MedicalExamAptitude,
} from '@/entities/hr/medical-exam';
import type { MedicalExam as PrismaMedicalExam } from '@prisma/generated/client.js';

export function mapMedicalExamPrismaToDomain(exam: PrismaMedicalExam) {
  return {
    tenantId: new UniqueEntityID(exam.tenantId),
    employeeId: new UniqueEntityID(exam.employeeId),
    type: exam.type as MedicalExamType,
    examDate: exam.examDate,
    expirationDate: exam.expirationDate ?? undefined,
    doctorName: exam.doctorName,
    doctorCrm: exam.doctorCrm,
    result: exam.result as MedicalExamResult,
    observations: exam.observations ?? undefined,
    documentUrl: exam.documentUrl ?? undefined,
    // PCMSO fields
    examCategory: (exam.examCategory as MedicalExamType) ?? undefined,
    validityMonths: exam.validityMonths ?? undefined,
    clinicName: exam.clinicName ?? undefined,
    clinicAddress: exam.clinicAddress ?? undefined,
    physicianName: exam.physicianName ?? undefined,
    physicianCRM: exam.physicianCRM ?? undefined,
    aptitude: (exam.aptitude as MedicalExamAptitude) ?? undefined,
    restrictions: exam.restrictions ?? undefined,
    nextExamDate: exam.nextExamDate ?? undefined,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  };
}
