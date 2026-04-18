import type { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Ensures the employee has a work schedule in effect today.
 *
 * The Employee entity in this codebase does NOT carry a direct
 * `workScheduleId` FK — instead, work schedules are linked via
 * `ShiftAssignment` (Employee → ShiftAssignment → Shift → WorkSchedule).
 * For the punch pipeline, "has schedule" is operationalized as "has at
 * least one ACTIVE ShiftAssignment for this employee in this tenant".
 *
 * Rejection code: `NO_WORK_SCHEDULE`.
 *
 * This is the final cheap validator — Geofence runs after it because
 * geofence can require a DB read of the zone.
 */
export class WorkScheduleValidator implements PunchValidator {
  readonly name = 'WorkScheduleValidator';

  constructor(
    private readonly shiftAssignmentsRepository: ShiftAssignmentsRepository,
  ) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    const activeAssignment =
      await this.shiftAssignmentsRepository.findActiveByEmployee(
        ctx.employeeId,
        ctx.tenantId,
      );

    if (!activeAssignment) {
      return {
        outcome: 'REJECT',
        code: 'NO_WORK_SCHEDULE',
        reason: 'Funcionário não possui jornada de trabalho configurada',
      };
    }

    return { outcome: 'ACCEPT' };
  }
}
