/**
 * DetectMissedPunchesUseCase — Phase 07 / Plan 07-05a (Wave 2).
 *
 * Pure aggregate use case consumido pelo scheduler `punch-detect-missed-
 * scheduler` (22h timezone-tenant). Para cada funcionário ativo do tenant:
 *   1. Holiday tenant-wide cobrindo a data → skip global (retorna cedo,
 *      nenhum log criado).
 *   2. `ShiftAssignmentsRepository.findActiveOnDate` → null? skip funcionário
 *      (sem expectativa de trabalho).
 *   3. `TimeEntriesRepository.existsOnDate` → true? skip (bateu).
 *   4. `VacationPeriodsRepository.findApprovedCoveringDate` → match? skip.
 *   5. `AbsencesRepository.findActiveCoveringDate` → match? skip.
 *   6. Caso contrário, `PunchMissedLogRepository.create(log)` com try/catch
 *      para `P2002` (UNIQUE [tenantId, employeeId, date] — idempotência na
 *      base; re-runs silenciosamente pulam).
 *
 * Retorna `{ detected, createdLogIds, skippedExisting }` para telemetria
 * do scheduler. A emissão do evento `PUNCH_EVENTS.MISSED_PUNCHES_DETECTED`
 * é responsabilidade do scheduler (não do use case — separação pura).
 *
 * Invariantes:
 * - Sem Prisma import direto (delegado aos repos).
 * - Zero side-effects além de `punchMissedLogsRepo.create` — scheduler
 *   decide o que fazer com o resultado.
 */
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchMissedLog } from '@/entities/hr/punch-missed-log';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { HolidaysRepository } from '@/repositories/hr/holidays-repository';
import type { PunchMissedLogRepository } from '@/repositories/hr/punch-missed-log-repository';
import type { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface DetectMissedPunchesInput {
  tenantId: string;
  /** Data de referência (qualquer hora — normalizada para start-of-day UTC). */
  date: Date;
  /** BullMQ jobId — propagado para `PunchMissedLog.generatedByJobId` para trace reverso. */
  jobId?: string;
}

export interface DetectMissedPunchesResult {
  detected: number;
  createdLogIds: string[];
  skippedExisting: number;
  skippedEmployees: number;
  /** True quando havia feriado tenant-wide — scheduler skipa sem criar logs. */
  holidaySkipped: boolean;
}

function toUtcStartOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export class DetectMissedPunchesUseCase {
  constructor(
    private punchMissedLogsRepo: PunchMissedLogRepository,
    private employeesRepo: EmployeesRepository,
    private shiftAssignmentsRepo: ShiftAssignmentsRepository,
    private timeEntriesRepo: TimeEntriesRepository,
    private vacationsRepo: VacationPeriodsRepository,
    private absencesRepo: AbsencesRepository,
    private holidaysRepo: HolidaysRepository,
  ) {}

  async execute(
    input: DetectMissedPunchesInput,
  ): Promise<DetectMissedPunchesResult> {
    const { tenantId, date, jobId } = input;
    const dateKey = toUtcStartOfDay(date);
    const createdLogIds: string[] = [];
    let skippedExisting = 0;
    let skippedEmployees = 0;

    // 1. Holiday tenant-wide check (1x, early return).
    const holiday = await this.holidaysRepo.findOnDate(tenantId, dateKey);
    if (holiday) {
      return {
        detected: 0,
        createdLogIds,
        skippedExisting,
        skippedEmployees: 0,
        holidaySkipped: true,
      };
    }

    const employees = await this.employeesRepo.findManyActive(tenantId);

    for (const emp of employees) {
      const empId = emp.id.toString();

      const shift = await this.shiftAssignmentsRepo.findActiveOnDate(
        empId,
        tenantId,
        dateKey,
      );
      if (!shift) {
        skippedEmployees++;
        continue;
      }

      const punched = await this.timeEntriesRepo.existsOnDate(
        empId,
        tenantId,
        dateKey,
      );
      if (punched) {
        skippedEmployees++;
        continue;
      }

      const vacation = await this.vacationsRepo.findApprovedCoveringDate(
        empId,
        tenantId,
        dateKey,
      );
      if (vacation) {
        skippedEmployees++;
        continue;
      }

      const absence = await this.absencesRepo.findActiveCoveringDate(
        empId,
        tenantId,
        dateKey,
      );
      if (absence) {
        skippedEmployees++;
        continue;
      }

      try {
        const log = PunchMissedLog.create({
          tenantId: new UniqueEntityID(tenantId),
          employeeId: new UniqueEntityID(empId),
          date: dateKey,
          shiftAssignmentId: new UniqueEntityID(shift.id.toString()),
          expectedStartTime: null,
          expectedEndTime: null,
          generatedByJobId: jobId ?? null,
          resolvedAt: null,
          resolutionType: null,
        });
        await this.punchMissedLogsRepo.create(log);
        createdLogIds.push(log.id.toString());
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === 'P2002') {
          skippedExisting++;
          continue;
        }
        throw err;
      }
    }

    return {
      detected: createdLogIds.length,
      createdLogIds,
      skippedExisting,
      skippedEmployees,
      holidaySkipped: false,
    };
  }
}
