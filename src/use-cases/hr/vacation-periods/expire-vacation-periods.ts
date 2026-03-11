import type { VacationPeriodsRepository } from '@/repositories/hr/vacation-periods-repository';

export interface ExpireVacationPeriodsRequest {
  tenantId: string;
}

export interface ExpireVacationPeriodsResponse {
  expiredCount: number;
}

export class ExpireVacationPeriodsUseCase {
  constructor(private vacationPeriodsRepository: VacationPeriodsRepository) {}

  async execute(
    request: ExpireVacationPeriodsRequest,
  ): Promise<ExpireVacationPeriodsResponse> {
    const { tenantId } = request;

    const expiredPeriods =
      await this.vacationPeriodsRepository.findExpiredPeriods(tenantId);

    for (const period of expiredPeriods) {
      period.expire();
      await this.vacationPeriodsRepository.save(period);
    }

    return { expiredCount: expiredPeriods.length };
  }
}
