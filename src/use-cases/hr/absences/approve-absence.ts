import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface ApproveAbsenceRequest {
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
  ) {}

  async execute(
    request: ApproveAbsenceRequest,
  ): Promise<ApproveAbsenceResponse> {
    const { absenceId, approvedBy } = request;

    // Find absence
    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
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

    // Approve the absence
    absence.approve(new UniqueEntityID(approvedBy));
    await this.absencesRepository.save(absence);

    // If it's a vacation, update the vacation period
    if (absence.isVacation()) {
      await this.updateVacationPeriod(absence);
    }

    return {
      absence,
    };
  }

  private async updateVacationPeriod(absence: Absence): Promise<void> {
    // Find available vacation periods
    const availablePeriods =
      await this.vacationPeriodsRepository.findAvailableByEmployee(
        absence.employeeId,
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
