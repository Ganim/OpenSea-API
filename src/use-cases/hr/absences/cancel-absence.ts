import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface CancelAbsenceRequest {
  absenceId: string;
}

export interface CancelAbsenceResponse {
  absence: Absence;
}

export class CancelAbsenceUseCase {
  constructor(
    private absencesRepository: AbsencesRepository,
    private vacationPeriodsRepository: VacationPeriodsRepository,
  ) {}

  async execute(request: CancelAbsenceRequest): Promise<CancelAbsenceResponse> {
    const { absenceId } = request;

    // Find absence
    const absence = await this.absencesRepository.findById(
      new UniqueEntityID(absenceId),
    );
    if (!absence) {
      throw new Error('Absence not found');
    }

    // Check if can be cancelled
    if (!absence.status.canBeCancelled()) {
      throw new Error('Absence cannot be cancelled in current status');
    }

    // Check if absence has already started
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (absence.startDate <= today && absence.isApproved()) {
      throw new Error('Cannot cancel an absence that has already started');
    }

    // If it's a vacation and was approved, restore vacation days
    if (absence.isVacation() && absence.isApproved()) {
      await this.restoreVacationDays(absence);
    }

    // Cancel the absence
    absence.cancel();
    await this.absencesRepository.save(absence);

    return {
      absence,
    };
  }

  private async restoreVacationDays(absence: Absence): Promise<void> {
    // Find the vacation periods that were used
    const periods =
      await this.vacationPeriodsRepository.findManyByEmployeeAndStatus(
        absence.employeeId,
        'SCHEDULED',
      );

    // This is a simplified implementation - in a real scenario,
    // you'd need to track which specific periods were used
    for (const period of periods) {
      if (period.scheduledStart?.getTime() === absence.startDate.getTime()) {
        period.cancelSchedule();
        await this.vacationPeriodsRepository.save(period);
        break;
      }
    }
  }
}
