import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus } from '@/entities/hr/bonus';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';

export interface DeleteBonusRequest {
  bonusId: string;
}

export interface DeleteBonusResponse {
  bonus: Bonus;
}

export class DeleteBonusUseCase {
  constructor(private bonusesRepository: BonusesRepository) {}

  async execute(request: DeleteBonusRequest): Promise<DeleteBonusResponse> {
    const { bonusId } = request;

    const bonus = await this.bonusesRepository.findById(
      new UniqueEntityID(bonusId),
    );

    if (!bonus) {
      throw new ResourceNotFoundError('Bônus não encontrado');
    }

    // Check if bonus is already paid
    if (bonus.isPaid) {
      throw new Error('Não é possível excluir um bônus já pago');
    }

    await this.bonusesRepository.delete(new UniqueEntityID(bonusId));

    return {
      bonus,
    };
  }
}

