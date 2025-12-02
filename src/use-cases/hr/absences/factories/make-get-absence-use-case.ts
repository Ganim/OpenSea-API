import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { GetAbsenceUseCase } from '../get-absence';

export function makeGetAbsenceUseCase(): GetAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();

  return new GetAbsenceUseCase(absencesRepository);
}
