import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus } from '@/entities/hr/bonus';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';

export interface ListBonusesRequest {
  tenantId: string;
  employeeId?: string;
  isPaid?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface ListBonusesResponse {
  bonuses: Bonus[];
}

export class ListBonusesUseCase {
  constructor(private bonusesRepository: BonusesRepository) {}

  async execute(request: ListBonusesRequest): Promise<ListBonusesResponse> {
    const { tenantId, employeeId, isPaid, startDate, endDate } = request;

    const bonuses = await this.bonusesRepository.findMany(tenantId, {
      employeeId: employeeId ? new UniqueEntityID(employeeId) : undefined,
      isPaid,
      startDate,
      endDate,
    });

    return {
      bonuses,
    };
  }
}
