import { PrismaOccupationalExamRequirementsRepository } from '@/repositories/hr/prisma/prisma-occupational-exam-requirements-repository';
import { DeleteExamRequirementUseCase } from '../delete-exam-requirement';

export function makeDeleteExamRequirementUseCase() {
  const examRequirementsRepository =
    new PrismaOccupationalExamRequirementsRepository();
  return new DeleteExamRequirementUseCase(examRequirementsRepository);
}
