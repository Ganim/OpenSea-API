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
import { makeVerifyPunchPinUseCase } from '@/use-cases/hr/punch-pin/factories/make-verify-punch-pin';

import { ExecutePunchUseCase } from '../execute-punch';
import { AbsenceActiveValidator } from '../validators/absence-active.validator';
import { EmployeeActiveValidator } from '../validators/employee-active.validator';
import { FaceMatchValidator } from '../validators/face-match.validator';
import { GeofenceValidator } from '../validators/geofence.validator';
import { PunchValidationPipeline } from '../validators/pipeline';
import { VacationActiveValidator } from '../validators/vacation-active.validator';
import { WorkScheduleValidator } from '../validators/work-schedule.validator';

/**
 * Factory for the unified punch endpoint (POST /v1/hr/punch/clock).
 *
 * Wires the 6 validators in the canonical pipeline order documented in
 * D-05 + Plan 05-07 pipeline_order_spec:
 *
 *   EmployeeActive → VacationActive → AbsenceActive → WorkSchedule → Geofence → FaceMatch
 *
 * The order is intentionally "cheapest first, face-match last": the
 * cheaper gates short-circuit pathological cases before paying for the
 * face-enrollment lookup + AES-GCM decrypt + Euclidean distance loop.
 * Geofence stays before FaceMatch so that an out-of-geofence AND face-
 * match-low batida produces two separate `PunchApproval` rows (both
 * approval reasons accumulate per D-12 always-write semantics).
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

  const pipeline = new PunchValidationPipeline([
    new EmployeeActiveValidator(employeesRepo),
    new VacationActiveValidator(vacationsRepo),
    new AbsenceActiveValidator(absencesRepo),
    new WorkScheduleValidator(shiftAssignmentsRepo),
    new GeofenceValidator(geofenceZonesRepo),
    new FaceMatchValidator(faceEnrollmentsRepo, punchConfigRepo),
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
