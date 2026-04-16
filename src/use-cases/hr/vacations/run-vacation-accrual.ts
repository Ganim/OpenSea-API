import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface RunVacationAccrualRequest {
  tenantId: string;
  /**
   * Reference date used to evaluate the 12-month anniversary.
   * Defaults to "now" — pass a fixed date to make the run deterministic in tests.
   */
  referenceDate?: Date;
}

export interface RunVacationAccrualResponse {
  evaluatedEmployees: number;
  createdPeriods: number;
  skippedPeriods: number;
}

/**
 * Vacation accrual job — for every active employee in the tenant, opens a new
 * acquisitive vacation period whenever the employee has just completed another
 * 12-month anniversary since the hire date AND there is no open acquisitive
 * (PENDING) period covering today.
 *
 * Idempotent: safe to re-run on the same day. The existing PENDING period for
 * the current acquisitive cycle is detected and skipped.
 */
export class RunVacationAccrualUseCase {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly vacationPeriodsRepository: VacationPeriodsRepository,
  ) {}

  async execute(
    request: RunVacationAccrualRequest,
  ): Promise<RunVacationAccrualResponse> {
    const { tenantId } = request;
    const referenceDate = request.referenceDate ?? new Date();

    const activeEmployees =
      await this.employeesRepository.findManyActive(tenantId);

    let createdPeriods = 0;
    let skippedPeriods = 0;

    for (const employee of activeEmployees) {
      const acquisitiveCycle = computeAcquisitiveCycleForReferenceDate(
        employee.hireDate,
        referenceDate,
      );

      // Employee has not yet completed the first 12 months — nothing to accrue.
      if (!acquisitiveCycle) {
        skippedPeriods++;
        continue;
      }

      const openPeriods =
        await this.vacationPeriodsRepository.findManyByEmployeeAndStatus(
          employee.id,
          'PENDING',
          tenantId,
        );

      const alreadyHasCurrentCycle = openPeriods.some((period) =>
        sameDay(period.acquisitionStart, acquisitiveCycle.acquisitionStart),
      );

      if (alreadyHasCurrentCycle) {
        skippedPeriods++;
        continue;
      }

      const vacationPeriod = VacationPeriod.createFromHireDate(
        new UniqueEntityID(tenantId),
        employee.id,
        acquisitiveCycle.acquisitionStart,
      );

      await this.vacationPeriodsRepository.create({
        tenantId,
        employeeId: employee.id,
        acquisitionStart: vacationPeriod.acquisitionStart,
        acquisitionEnd: vacationPeriod.acquisitionEnd,
        concessionStart: vacationPeriod.concessionStart,
        concessionEnd: vacationPeriod.concessionEnd,
        totalDays: vacationPeriod.totalDays,
        usedDays: 0,
        soldDays: 0,
        remainingDays: vacationPeriod.totalDays,
        status: 'PENDING',
      });

      createdPeriods++;
    }

    return {
      evaluatedEmployees: activeEmployees.length,
      createdPeriods,
      skippedPeriods,
    };
  }
}

/**
 * Returns the acquisitive cycle whose start anniversary has been reached on or
 * before the reference date, or null if the employee has not yet completed the
 * first 12 months of work.
 */
function computeAcquisitiveCycleForReferenceDate(
  hireDate: Date,
  referenceDate: Date,
): { acquisitionStart: Date; acquisitionEnd: Date } | null {
  const completedYears = fullYearsBetween(hireDate, referenceDate);

  if (completedYears < 1) {
    return null;
  }

  const acquisitionStart = new Date(hireDate);
  acquisitionStart.setFullYear(hireDate.getFullYear() + (completedYears - 1));

  const acquisitionEnd = new Date(acquisitionStart);
  acquisitionEnd.setFullYear(acquisitionEnd.getFullYear() + 1);
  acquisitionEnd.setDate(acquisitionEnd.getDate() - 1);

  return { acquisitionStart, acquisitionEnd };
}

function fullYearsBetween(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const monthDiff = to.getMonth() - from.getMonth();
  const dayDiff = to.getDate() - from.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--;
  }

  return years;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
