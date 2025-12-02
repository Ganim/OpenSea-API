import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface SellVacationDaysRequest {
  vacationPeriodId: string;
  daysToSell: number;
}

export interface SellVacationDaysResponse {
  vacationPeriod: VacationPeriod;
}

export class SellVacationDaysUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: SellVacationDaysRequest,
  ): Promise<SellVacationDaysResponse> {
    const { vacationPeriodId, daysToSell } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    // CLT: Pode vender no máximo 1/3 das férias (10 dias de 30)
    const maxSellableDays = Math.floor(vacationPeriod.totalDays / 3);

    if (daysToSell > maxSellableDays) {
      throw new BadRequestError(
        `Só é permitido vender até ${maxSellableDays} dias de férias (1/3 do total)`,
      );
    }

    if (daysToSell > vacationPeriod.remainingDays) {
      throw new BadRequestError(
        `Não há dias suficientes disponíveis. Dias restantes: ${vacationPeriod.remainingDays}`,
      );
    }

    if (!vacationPeriod.canSellDays()) {
      throw new BadRequestError(
        `Não é possível vender férias com status: ${vacationPeriod.status.value}`,
      );
    }

    vacationPeriod.sellDays(daysToSell);

    await this.vacationPeriodsRepository.save(vacationPeriod);

    return {
      vacationPeriod,
    };
  }
}
