import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationSplit } from '@/entities/hr/vacation-split';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';
import type { VacationSplitsRepository } from '@/repositories/hr/vacation-splits-repository';

export interface ListVacationSplitsRequest {
  tenantId: string;
  vacationPeriodId: string;
}

export interface ListVacationSplitsResponse {
  splits: VacationSplit[];
}

export class ListVacationSplitsUseCase {
  constructor(
    private vacationPeriodsRepository: VacationPeriodsRepository,
    private vacationSplitsRepository: VacationSplitsRepository,
  ) {}

  async execute(
    request: ListVacationSplitsRequest,
  ): Promise<ListVacationSplitsResponse> {
    const { tenantId, vacationPeriodId } = request;

    // Verifica se o período de férias existe e pertence ao tenant
    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
      tenantId,
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    const splits =
      await this.vacationSplitsRepository.findByVacationPeriodId(
        vacationPeriodId,
      );

    return { splits };
  }
}
