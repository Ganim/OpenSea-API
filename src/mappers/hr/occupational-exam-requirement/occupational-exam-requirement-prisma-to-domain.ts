import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MedicalExamType } from '@/entities/hr/medical-exam';
import type { OccupationalExamRequirement as PrismaOccupationalExamRequirement } from '@prisma/generated/client.js';

export function mapOccupationalExamRequirementPrismaToDomain(
  record: PrismaOccupationalExamRequirement,
) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    positionId: record.positionId
      ? new UniqueEntityID(record.positionId)
      : undefined,
    examType: record.examType,
    examCategory: record.examCategory as MedicalExamType,
    frequencyMonths: record.frequencyMonths,
    isMandatory: record.isMandatory,
    description: record.description ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
