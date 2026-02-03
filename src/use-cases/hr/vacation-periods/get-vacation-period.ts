import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface GetVacationPeriodRequest {
  tenantId: string;
  vacationPeriodId: string;
}

export interface GetVacationPeriodResponse {
  vacationPeriod: VacationPeriod;
}

export class GetVacationPeriodUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: GetVacationPeriodRequest,
  ): Promise<GetVacationPeriodResponse> {
    const { tenantId, vacationPeriodId } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
      tenantId,
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    return {
      vacationPeriod,
    };
  }
}
