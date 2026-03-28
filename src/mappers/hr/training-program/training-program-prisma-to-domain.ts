import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingProgram as PrismaTrainingProgram } from '@prisma/generated/client.js';

export function mapTrainingProgramPrismaToDomain(
  program: PrismaTrainingProgram,
) {
  return {
    tenantId: new UniqueEntityID(program.tenantId),
    name: program.name,
    description: program.description ?? undefined,
    category: program.category,
    format: program.format,
    durationHours: program.durationHours,
    instructor: program.instructor ?? undefined,
    maxParticipants: program.maxParticipants ?? undefined,
    isActive: program.isActive,
    isMandatory: program.isMandatory,
    validityMonths: program.validityMonths ?? undefined,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    deletedAt: program.deletedAt ?? undefined,
  };
}
