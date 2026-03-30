import { PrismaOccupationalExamRequirementsRepository } from '@/repositories/hr/prisma/prisma-occupational-exam-requirements-repository';
import { CreateExamRequirementUseCase } from '../create-exam-requirement';

export function makeCreateExamRequirementUseCase() {
  const examRequirementsRepository =
    new PrismaOccupationalExamRequirementsRepository();
  return new CreateExamRequirementUseCase(examRequirementsRepository);
}
