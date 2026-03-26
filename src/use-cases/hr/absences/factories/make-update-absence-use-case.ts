import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { UpdateAbsenceUseCase } from '../update-absence';

export function makeUpdateAbsenceUseCase(): UpdateAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  return new UpdateAbsenceUseCase(absencesRepository);
}
