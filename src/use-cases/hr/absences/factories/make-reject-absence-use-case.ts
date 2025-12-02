import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { RejectAbsenceUseCase } from '../reject-absence';

export function makeRejectAbsenceUseCase(): RejectAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();

  return new RejectAbsenceUseCase(absencesRepository);
}
