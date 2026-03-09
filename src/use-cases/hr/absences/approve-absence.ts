import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import type { TransactionManager } from '@/lib/transaction-manager';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';
import type { CalendarSyncService } from '@/services/calendar/calendar-sync.service';

export interface ApproveAbsenceRequest {
  tenantId: string;
  absenceId: string;
  approvedBy: string;
}

export interface ApproveAbsenceResponse {
  absence: Absence;
}

export class ApproveAbsenceUseCase {
  constructor(
    private absencesRepository: AbsencesRepository,
    private vacationPeriodsRepository: VacationPeriodsRepository,
    private employeesRepository: EmployeesRepository,
    private calendarSyncService?: CalendarSyncService,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: ApproveAbsenceRequest,
  ): Promise<ApproveAbsenceResponse> {
    const { tenantId, absenceId, approvedBy } = request;

    // Find absence
    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
      tenantId,
    );
    if (!absence) {
      throw new Error('Absence not found');
    }

    // Check if already approved
    if (absence.isApproved()) {
      throw new Error('Absence is already approved');
    }

    // Check if can be approved
    if (!absence.isPending()) {
      throw new Error('Only pending absences can be approved');
    }

    // Approve the absence and deduct vacation days atomically
    absence.approve(new UniqueEntityID(approvedBy));

    const doApprove = async () => {
      await this.absencesRepository.save(absence);

      if (absence.isVacation()) {
        await this.updateVacationPeriod(absence, tenantId);
      }
    };

    if (this.transactionManager) {
      await this.transactionManager.run(() => doApprove());
    } else {
      await doApprove();
    }

    // Sync to calendar (non-blocking, outside transaction)
    if (this.calendarSyncService) {
      try {
        const employee = await this.employeesRepository.findById(
          absence.employeeId,
          tenantId,
        );
        const employeeName =
          employee?.fullName ?? absence.employeeId.toString();

        await this.calendarSyncService.syncAbsence({
          tenantId,
          absenceId,
          absenceType: absence.type.value,
          employeeName,
          startDate: absence.startDate,
          endDate: absence.endDate,
          userId: approvedBy,
        });
      } catch {
        // Calendar sync failure should not block the operation
      }
    }

    return {
      absence,
    };
  }

  private async updateVacationPeriod(
    absence: Absence,
    tenantId: string,
  ): Promise<void> {
    // Find available vacation periods
    const availablePeriods =
      await this.vacationPeriodsRepository.findAvailableByEmployee(
        absence.employeeId,
        tenantId,
      );

    if (availablePeriods.length === 0) {
      return; // No periods to update
    }

    let remainingDaysToDeduct = absence.totalDays;

    // Deduct from available periods (prioritize expiring first)
    for (const period of availablePeriods) {
      if (remainingDaysToDeduct <= 0) break;

      const daysToDeduct = Math.min(
        period.remainingDays,
        remainingDaysToDeduct,
      );
      period.schedule(absence.startDate, absence.endDate, daysToDeduct);

      await this.vacationPeriodsRepository.save(period);
      remainingDaysToDeduct -= daysToDeduct;
    }
  }
}
