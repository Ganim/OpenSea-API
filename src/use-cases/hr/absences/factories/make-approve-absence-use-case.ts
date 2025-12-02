import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { ApproveAbsenceUseCase } from '../approve-absence';

export function makeApproveAbsenceUseCase(): ApproveAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();

  return new ApproveAbsenceUseCase(
    absencesRepository,
    vacationPeriodsRepository,
  );
}
