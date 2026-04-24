import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaHolidaysRepository } from '@/repositories/hr/prisma/prisma-holidays-repository';
import { PrismaPunchMissedLogRepository } from '@/repositories/hr/prisma/prisma-punch-missed-log-repository';
import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';

import { DetectMissedPunchesUseCase } from '../detect-missed-punches';

/**
 * Phase 07 / Plan 07-05a — factory do `DetectMissedPunchesUseCase`.
 *
 * Injeta as 7 dependências Prisma. Consumido pelo scheduler
 * `punch-detect-missed-scheduler` (22h timezone-tenant).
 */
export function makeDetectMissedPunchesUseCase() {
  return new DetectMissedPunchesUseCase(
    new PrismaPunchMissedLogRepository(),
    new PrismaEmployeesRepository(),
    new PrismaShiftAssignmentsRepository(),
    new PrismaTimeEntriesRepository(),
    new PrismaVacationPeriodsRepository(),
    new PrismaAbsencesRepository(),
    new PrismaHolidaysRepository(),
  );
}
