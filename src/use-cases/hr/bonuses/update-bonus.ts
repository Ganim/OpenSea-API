import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus } from '@/entities/hr/bonus';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';

export interface UpdateBonusRequest {
  tenantId: string;
  bonusId: string;
  name?: string;
  amount?: number;
  reason?: string;
  date?: Date;
}

export interface UpdateBonusResponse {
  bonus: Bonus;
}

export class UpdateBonusUseCase {
  constructor(private bonusesRepository: BonusesRepository) {}

  async execute(request: UpdateBonusRequest): Promise<UpdateBonusResponse> {
    const { tenantId, bonusId, name, amount, reason, date } = request;

    const bonus = await this.bonusesRepository.findById(
      new UniqueEntityID(bonusId),
      tenantId,
    );

    if (!bonus) {
      throw new ResourceNotFoundError('Bônus não encontrado');
    }

    // Cannot update a paid bonus
    if (bonus.isPaid) {
      throw new BadRequestError('Não é possível editar um bônus já pago');
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new BadRequestError('O nome do bônus é obrigatório');
      }
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (amount <= 0) {
        throw new BadRequestError('O valor do bônus deve ser maior que zero');
      }
    }

    // Validate reason if provided
    if (reason !== undefined) {
      if (!reason || reason.trim().length === 0) {
        throw new BadRequestError('O motivo do bônus é obrigatório');
      }
    }

    const updatedBonus = await this.bonusesRepository.update({
      id: new UniqueEntityID(bonusId),
      name: name?.trim(),
      amount,
      reason: reason?.trim(),
      date,
    });

    if (!updatedBonus) {
      throw new ResourceNotFoundError('Bônus não encontrado');
    }

    return {
      bonus: updatedBonus,
    };
  }
}
