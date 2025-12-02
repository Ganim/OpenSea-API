import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { CancelAbsenceUseCase } from '../cancel-absence';

export function makeCancelAbsenceUseCase(): CancelAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new CancelAbsenceUseCase(
    absencesRepository,
    vacationPeriodsRepository,
  );
}
