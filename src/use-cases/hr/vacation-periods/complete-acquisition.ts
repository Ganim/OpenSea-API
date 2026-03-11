import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';
import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface CompleteAcquisitionRequest {
  tenantId: string;
  vacationPeriodId: string;
}

export interface CompleteAcquisitionResponse {
  vacationPeriod: VacationPeriod;
}

export class CompleteAcquisitionUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: CompleteAcquisitionRequest,
  ): Promise<CompleteAcquisitionResponse> {
    const { tenantId, vacationPeriodId } = request;

    const vacationPeriod = await this.vacationPeriodsRepository.findById(
      new UniqueEntityID(vacationPeriodId),
      tenantId,
    );

    if (!vacationPeriod) {
      throw new ResourceNotFoundError('VacationPeriod');
    }

    if (!vacationPeriod.isPending()) {
      throw new BadRequestError(
        'Apenas períodos em aquisição podem ser concluídos',
      );
    }

    vacationPeriod.completeAcquisition();
    await this.vacationPeriodsRepository.save(vacationPeriod);

    return { vacationPeriod };
  }
}
