import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction } from '@/entities/hr/deduction';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';

export interface UpdateDeductionRequest {
  tenantId: string;
  deductionId: string;
  name?: string;
  amount?: number;
  reason?: string;
  date?: Date;
  isRecurring?: boolean;
  installments?: number;
}

export interface UpdateDeductionResponse {
  deduction: Deduction;
}

export class UpdateDeductionUseCase {
  constructor(private deductionsRepository: DeductionsRepository) {}

  async execute(
    request: UpdateDeductionRequest,
  ): Promise<UpdateDeductionResponse> {
    const {
      tenantId,
      deductionId,
      name,
      amount,
      reason,
      date,
      isRecurring,
      installments,
    } = request;

    const deduction = await this.deductionsRepository.findById(
      new UniqueEntityID(deductionId),
      tenantId,
    );

    if (!deduction) {
      throw new ResourceNotFoundError('Dedução não encontrada');
    }

    // Cannot update an already applied non-recurring deduction
    if (deduction.isApplied && !deduction.isRecurring) {
      throw new BadRequestError(
        'Não é possível editar uma dedução já aplicada',
      );
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      throw new BadRequestError('O valor da dedução deve ser maior que zero');
    }

    // Validate name if provided
    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError('O nome da dedução é obrigatório');
    }

    // Validate reason if provided
    if (reason !== undefined && reason.trim().length === 0) {
      throw new BadRequestError('O motivo da dedução é obrigatório');
    }

    // Validate installments if provided
    if (installments !== undefined && installments < 1) {
      throw new BadRequestError('O número de parcelas deve ser pelo menos 1');
    }

    const updatedDeduction = await this.deductionsRepository.update({
      id: new UniqueEntityID(deductionId),
      name: name?.trim(),
      amount,
      reason: reason?.trim(),
      date,
      isRecurring,
      installments,
    });

    if (!updatedDeduction) {
      throw new ResourceNotFoundError('Dedução não encontrada');
    }

    return {
      deduction: updatedDeduction,
    };
  }
}
