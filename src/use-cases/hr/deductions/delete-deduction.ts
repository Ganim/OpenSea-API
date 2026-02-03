import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction } from '@/entities/hr/deduction';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';

export interface DeleteDeductionRequest {
  tenantId: string;
  deductionId: string;
}

export interface DeleteDeductionResponse {
  deduction: Deduction;
}

export class DeleteDeductionUseCase {
  constructor(private deductionsRepository: DeductionsRepository) {}

  async execute(
    request: DeleteDeductionRequest,
  ): Promise<DeleteDeductionResponse> {
    const { tenantId, deductionId } = request;

    const deduction = await this.deductionsRepository.findById(
      new UniqueEntityID(deductionId),
      tenantId,
    );

    if (!deduction) {
      throw new ResourceNotFoundError('Dedução não encontrada');
    }

    // Check if deduction is already applied
    if (deduction.isApplied) {
      throw new Error('Não é possível excluir uma dedução já aplicada');
    }

    await this.deductionsRepository.delete(new UniqueEntityID(deductionId));

    return {
      deduction,
    };
  }
}
