import { PrismaOccupationalExamRequirementsRepository } from '@/repositories/hr/prisma/prisma-occupational-exam-requirements-repository';
import { ListExamRequirementsUseCase } from '../list-exam-requirements';

export function makeListExamRequirementsUseCase() {
  const examRequirementsRepository =
    new PrismaOccupationalExamRequirementsRepository();
  return new ListExamRequirementsUseCase(examRequirementsRepository);
}
