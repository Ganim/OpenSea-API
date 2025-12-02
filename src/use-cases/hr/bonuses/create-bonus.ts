import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bonus } from '@/entities/hr/bonus';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface CreateBonusRequest {
  employeeId: string;
  name: string;
  amount: number;
  reason: string;
  date: Date;
}

export interface CreateBonusResponse {
  bonus: Bonus;
}

export class CreateBonusUseCase {
  constructor(
    private bonusesRepository: BonusesRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: CreateBonusRequest): Promise<CreateBonusResponse> {
    const { employeeId, name, amount, reason, date } = request;

    // Validate amount
    if (amount <= 0) {
      throw new Error('O valor do bônus deve ser maior que zero');
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('O nome do bônus é obrigatório');
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      throw new Error('O motivo do bônus é obrigatório');
    }

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Create bonus
    const bonus = await this.bonusesRepository.create({
      employeeId: new UniqueEntityID(employeeId),
      name: name.trim(),
      amount,
      reason: reason.trim(),
      date,
    });

    return {
      bonus,
    };
  }
}

