import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaFaceEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-face-enrollments-repository';
import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { PrismaPunchConfigRepository } from '@/repositories/hr/prisma/prisma-punch-config-repository';
import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { getRedisClient } from '@/lib/redis';
import { makeVerifyPunchPinUseCase } from '@/use-cases/hr/punch-pin/factories/make-verify-punch-pin';

import { ExecutePunchUseCase } from '../execute-punch';
import { AbsenceActiveValidator } from '../validators/absence-active.validator';
import { ClockDriftValidator } from '../validators/clock-drift.validator';
import { EmployeeActiveValidator } from '../validators/employee-active.validator';
import { FaceMatchStreakValidator } from '../validators/face-match-streak.validator';
import { FaceMatchValidator } from '../validators/face-match.validator';
import { GeofenceValidator } from '../validators/geofence.validator';
import { GpsConsistencyValidator } from '../validators/gps-consistency.validator';
import { PunchRateLimitValidator } from '../validators/rate-limit.validator';
import { PunchValidationPipeline } from '../validators/pipeline';
import { VacationActiveValidator } from '../validators/vacation-active.validator';
import { WorkScheduleValidator } from '../validators/work-schedule.validator';

/**
 * Factory for the unified punch endpoint (POST /v1/hr/punch/clock).
 *
 * Wires 10 validators in the canonical pipeline order (Phase 9 final):
 *   1. PunchRateLimitValidator (Phase 9 D-17 — fast-fail)
 *   2. ClockDriftValidator (Phase 9 D-05 — fast-fail)
 *   3. EmployeeActiveValidator (Phase 4)
 *   4. VacationActiveValidator (Phase 4)
 *   5. AbsenceActiveValidator (Phase 4)
 *   6. WorkScheduleValidator (Phase 4)
 *   7. GpsConsistencyValidator (Phase 9 D-01..D-04)
 *   8. GeofenceValidator (Phase 4)
 *   9. FaceMatchValidator (Phase 5)
 *   10. FaceMatchStreakValidator (Phase 9 D-09..D-12 — reads faceMatchOutcome from #9)
 *
 * The order prioritizes fast-fail antifraude checks first (rate-limit, clock-drift),
 * then employee status gates, then geo/face validators. Phase 9 enrichment:
 * pipeline.run() mutates ctx to set `faceMatchOutcome` based on FaceMatchValidator
 * result, so FaceMatchStreakValidator can read it downstream (Pitfall 6 resolution).
 *
 * Phase 5 (Plan 05-07): also wires `VerifyPunchPinUseCase` for the kiosk
 * pin+matricula identification branch. The FaceMatchValidator gets its
 * own `faceEnrollmentsRepo` + `punchConfigRepo` (same singleton as the
 * rest of the pipeline; redundant construction is cheap on boot).
 */
export function makeExecutePunchUseCase(): ExecutePunchUseCase {
  const employeesRepo = new PrismaEmployeesRepository();
  const timeEntriesRepo = new PrismaTimeEntriesRepository();
  const vacationsRepo = new PrismaVacationPeriodsRepository();
  const absencesRepo = new PrismaAbsencesRepository();
  const shiftAssignmentsRepo = new PrismaShiftAssignmentsRepository();
  const geofenceZonesRepo = new PrismaGeofenceZonesRepository();
  const punchConfigRepo = new PrismaPunchConfigRepository();
  const punchDevicesRepo = new PrismaPunchDevicesRepository();
  const punchApprovalsRepo = new PrismaPunchApprovalsRepository();
  const faceEnrollmentsRepo = new PrismaFaceEnrollmentsRepository();
  const redis = getRedisClient();

  const pipeline = new PunchValidationPipeline([
    new PunchRateLimitValidator(redis), // Phase 9 D-17 — fast-fail
    new ClockDriftValidator(), // Phase 9 D-05 — fast-fail
    new EmployeeActiveValidator(employeesRepo),
    new VacationActiveValidator(vacationsRepo),
    new AbsenceActiveValidator(absencesRepo),
    new WorkScheduleValidator(shiftAssignmentsRepo),
    new GpsConsistencyValidator(), // Phase 9 D-01..D-04
    new GeofenceValidator(geofenceZonesRepo),
    new FaceMatchValidator(faceEnrollmentsRepo, punchConfigRepo), // Phase 5 advisory
    new FaceMatchStreakValidator(redis), // Phase 9 D-09..D-12 — reads faceMatchOutcome
  ]);

  const verifyPunchPinUseCase = makeVerifyPunchPinUseCase();

  return new ExecutePunchUseCase(
    timeEntriesRepo,
    employeesRepo,
    punchDevicesRepo,
    punchApprovalsRepo,
    punchConfigRepo,
    pipeline,
    verifyPunchPinUseCase,
  );
}
