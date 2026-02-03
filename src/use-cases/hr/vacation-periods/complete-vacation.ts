import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface CompleteVacationRequest {
  tenantId: string;
  vacationPeriodId: string;
  daysUsed: number;
}

export interface CompleteVacationResponse {
  vacationPeriod: VacationPeriod;
}

export class CompleteVacationUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: CompleteVacationRequest,
  ): Promise<CompleteVacationResponse> {
    const { tenantId, vacationPeriodId, daysUsed } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
      tenantId,
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    if (!vacationPeriod.isInProgress() && !vacationPeriod.isScheduled()) {
      throw new BadRequestError(
        'Férias precisam estar em progresso ou agendadas para serem concluídas',
      );
    }

    if (daysUsed > vacationPeriod.remainingDays) {
      throw new BadRequestError(
        `Não é possível registrar ${daysUsed} dias. Dias restantes: ${vacationPeriod.remainingDays}`,
      );
    }

    vacationPeriod.complete(daysUsed);

    await this.vacationPeriodsRepository.save(vacationPeriod);

    return {
      vacationPeriod,
    };
  }
}
