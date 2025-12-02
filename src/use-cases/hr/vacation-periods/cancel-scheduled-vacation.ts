import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface CancelScheduledVacationRequest {
  vacationPeriodId: string;
}

export interface CancelScheduledVacationResponse {
  vacationPeriod: VacationPeriod;
}

export class CancelScheduledVacationUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: CancelScheduledVacationRequest,
  ): Promise<CancelScheduledVacationResponse> {
    const { vacationPeriodId } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    if (!vacationPeriod.isScheduled()) {
      throw new BadRequestError(
        'Somente férias agendadas podem ser canceladas',
      );
    }

    vacationPeriod.cancelSchedule();

    await this.vacationPeriodsRepository.save(vacationPeriod);

    return {
      vacationPeriod,
    };
  }
}
