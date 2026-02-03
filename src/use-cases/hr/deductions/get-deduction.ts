import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction } from '@/entities/hr/deduction';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';

export interface GetDeductionRequest {
  tenantId: string;
  deductionId: string;
}

export interface GetDeductionResponse {
  deduction: Deduction;
}

export class GetDeductionUseCase {
  constructor(private deductionsRepository: DeductionsRepository) {}

  async execute(request: GetDeductionRequest): Promise<GetDeductionResponse> {
    const { tenantId, deductionId } = request;

    const deduction = await this.deductionsRepository.findById(
      new UniqueEntityID(deductionId),
      tenantId,
    );

    if (!deduction) {
      throw new ResourceNotFoundError('Dedução não encontrada');
    }

    return {
      deduction,
    };
  }
}
