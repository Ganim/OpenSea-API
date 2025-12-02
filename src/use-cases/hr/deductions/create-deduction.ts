import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction } from '@/entities/hr/deduction';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface CreateDeductionRequest {
  employeeId: string;
  name: string;
  amount: number;
  reason: string;
  date: Date;
  isRecurring?: boolean;
  installments?: number;
}

export interface CreateDeductionResponse {
  deduction: Deduction;
}

export class CreateDeductionUseCase {
  constructor(
    private deductionsRepository: DeductionsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: CreateDeductionRequest,
  ): Promise<CreateDeductionResponse> {
    const {
      employeeId,
      name,
      amount,
      reason,
      date,
      isRecurring,
      installments,
    } = request;

    // Validate amount
    if (amount <= 0) {
      throw new Error('O valor da dedução deve ser maior que zero');
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      throw new Error('O nome da dedução é obrigatório');
    }

    // Validate reason
    if (!reason || reason.trim().length === 0) {
      throw new Error('O motivo da dedução é obrigatório');
    }

    // Validate installments
    if (installments && installments < 1) {
      throw new Error('O número de parcelas deve ser pelo menos 1');
    }

    // Verify employee exists
    const employee = await this.employeesRepository.findById(
      new UniqueEntityID(employeeId),
    );

    if (!employee) {
      throw new ResourceNotFoundError('Funcionário não encontrado');
    }

    // Create deduction
    const deduction = await this.deductionsRepository.create({
      employeeId: new UniqueEntityID(employeeId),
      name: name.trim(),
      amount,
      reason: reason.trim(),
      date,
      isRecurring,
      installments,
    });

    return {
      deduction,
    };
  }
}
