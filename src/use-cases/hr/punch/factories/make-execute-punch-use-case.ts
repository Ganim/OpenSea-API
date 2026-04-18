import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { PrismaPunchConfigRepository } from '@/repositories/hr/prisma/prisma-punch-config-repository';
import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';

import { ExecutePunchUseCase } from '../execute-punch';
import { AbsenceActiveValidator } from '../validators/absence-active.validator';
import { EmployeeActiveValidator } from '../validators/employee-active.validator';
import { GeofenceValidator } from '../validators/geofence.validator';
import { PunchValidationPipeline } from '../validators/pipeline';
import { VacationActiveValidator } from '../validators/vacation-active.validator';
import { WorkScheduleValidator } from '../validators/work-schedule.validator';

/**
 * Factory for the unified punch endpoint (POST /v1/hr/punch/clock).
 *
 * Wires the 5 validators in the canonical pipeline order documented in
 * D-05 and 04-PATTERNS:
 *
 *   EmployeeActive → VacationActive → AbsenceActive → WorkSchedule → Geofence
 *
 * The order is intentionally "cheapest first, geofence last": the
 * EmployeeActive single lookup short-circuits most pathological cases
 * before we pay for the vacation/absence range queries or the geofence
 * zone read.
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

  const pipeline = new PunchValidationPipeline([
    new EmployeeActiveValidator(employeesRepo),
    new VacationActiveValidator(vacationsRepo),
    new AbsenceActiveValidator(absencesRepo),
    new WorkScheduleValidator(shiftAssignmentsRepo),
    new GeofenceValidator(geofenceZonesRepo),
  ]);

  return new ExecutePunchUseCase(
    timeEntriesRepo,
    employeesRepo,
    punchDevicesRepo,
    punchApprovalsRepo,
    punchConfigRepo,
    pipeline,
  );
}
