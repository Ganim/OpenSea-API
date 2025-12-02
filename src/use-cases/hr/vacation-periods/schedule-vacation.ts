import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface ScheduleVacationRequest {
  vacationPeriodId: string;
  startDate: Date;
  endDate: Date;
  days: number;
}

export interface ScheduleVacationResponse {
  vacationPeriod: VacationPeriod;
}

export class ScheduleVacationUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: ScheduleVacationRequest,
  ): Promise<ScheduleVacationResponse> {
    const { vacationPeriodId, startDate, endDate, days } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    if (!vacationPeriod.canSchedule()) {
      throw new BadRequestError(
        `Não é possível agendar férias com status: ${vacationPeriod.status.value}`,
      );
    }

    if (days > vacationPeriod.remainingDays) {
      throw new BadRequestError(
        `Não há dias suficientes disponíveis. Dias restantes: ${vacationPeriod.remainingDays}`,
      );
    }

    // CLT: Mínimo de 5 dias para fracionamento
    if (days < 5) {
      throw new BadRequestError(
        'O período mínimo de férias é de 5 dias (CLT Art. 134 §1º)',
      );
    }

    // Validate date range
    if (startDate >= endDate) {
      throw new BadRequestError(
        'A data de início deve ser anterior à data de fim',
      );
    }

    // Calculate business days between dates
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff !== days - 1) {
      throw new BadRequestError(
        'O período informado não corresponde ao número de dias',
      );
    }

    vacationPeriod.schedule(startDate, endDate, days);

    await this.vacationPeriodsRepository.save(vacationPeriod);

    return {
      vacationPeriod,
    };
  }
}
