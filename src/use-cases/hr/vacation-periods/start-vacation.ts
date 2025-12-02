import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface StartVacationRequest {
  vacationPeriodId: string;
}

export interface StartVacationResponse {
  vacationPeriod: VacationPeriod;
}

export class StartVacationUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(request: StartVacationRequest): Promise<StartVacationResponse> {
    const { vacationPeriodId } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    if (!vacationPeriod.isScheduled()) {
      throw new BadRequestError(
        'Férias precisam estar agendadas para serem iniciadas',
      );
    }

    vacationPeriod.startVacation();

    await this.vacationPeriodsRepository.save(vacationPeriod);

    return {
      vacationPeriod,
    };
  }
}
