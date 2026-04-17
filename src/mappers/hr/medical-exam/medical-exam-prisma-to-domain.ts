import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  MedicalExamType,
  MedicalExamResult,
  MedicalExamAptitude,
} from '@/entities/hr/medical-exam';
import type { MedicalExam as PrismaMedicalExam } from '@prisma/generated/client.js';

/**
 * Prisma row → domain entity.
 *
 * The repository is responsible for decrypting the `*Encrypted` columns
 * BEFORE calling this mapper (see PrismaMedicalExamsRepository). This mapper
 * stays purely structural and reads the decrypted values out of the
 * `observations` / `restrictions` keys on the input, falling back to the
 * legacy plaintext columns during the backfill period.
 */
export function mapMedicalExamPrismaToDomain(
  exam: PrismaMedicalExam & {
    observationsEncrypted?: string | null;
    restrictionsEncrypted?: string | null;
  },
) {
  const observations =
    (exam as { observations?: string | null }).observations ??
    exam.observationsEncrypted ??
    undefined;
  const restrictions =
    (exam as { restrictions?: string | null }).restrictions ??
    exam.restrictionsEncrypted ??
    undefined;

  return {
    tenantId: new UniqueEntityID(exam.tenantId),
    employeeId: new UniqueEntityID(exam.employeeId),
    type: exam.type as MedicalExamType,
    examDate: exam.examDate,
    expirationDate: exam.expirationDate ?? undefined,
    doctorName: exam.doctorName,
    doctorCrm: exam.doctorCrm,
    result: exam.result as MedicalExamResult,
    observations: observations ?? undefined,
    documentUrl: exam.documentUrl ?? undefined,
    // PCMSO fields
    examCategory: (exam.examCategory as MedicalExamType) ?? undefined,
    validityMonths: exam.validityMonths ?? undefined,
    clinicName: exam.clinicName ?? undefined,
    clinicAddress: exam.clinicAddress ?? undefined,
    physicianName: exam.physicianName ?? undefined,
    physicianCRM: exam.physicianCRM ?? undefined,
    aptitude: (exam.aptitude as MedicalExamAptitude) ?? undefined,
    restrictions: restrictions ?? undefined,
    nextExamDate: exam.nextExamDate ?? undefined,
    deletedAt: (exam as { deletedAt?: Date | null }).deletedAt ?? undefined,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt,
  };
}
