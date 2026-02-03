import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus } from '@/entities/hr/bonus';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';

export interface GetBonusRequest {
  tenantId: string;
  bonusId: string;
}

export interface GetBonusResponse {
  bonus: Bonus;
}

export class GetBonusUseCase {
  constructor(private bonusesRepository: BonusesRepository) {}

  async execute(request: GetBonusRequest): Promise<GetBonusResponse> {
    const { tenantId, bonusId } = request;

    const bonus = await this.bonusesRepository.findById(
      new UniqueEntityID(bonusId),
      tenantId,
    );

    if (!bonus) {
      throw new ResourceNotFoundError('Bônus não encontrado');
    }

    return {
      bonus,
    };
  }
}
