import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type BankReconciliationDTO,
  bankReconciliationToDTO,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-to-dto';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface GetReconciliationByIdUseCaseRequest {
  tenantId: string;
  reconciliationId: string;
}

interface GetReconciliationByIdUseCaseResponse {
  reconciliation: BankReconciliationDTO;
}

export class GetReconciliationByIdUseCase {
  constructor(
    private bankReconciliationsRepository: BankReconciliationsRepository,
  ) {}

  async execute(
    request: GetReconciliationByIdUseCaseRequest,
  ): Promise<GetReconciliationByIdUseCaseResponse> {
    const reconciliation = await this.bankReconciliationsRepository.findById(
      new UniqueEntityID(request.reconciliationId),
      request.tenantId,
      true, // Include items
    );

    if (!reconciliation) {
      throw new ResourceNotFoundError(
        'Reconciliation not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    return { reconciliation: bankReconciliationToDTO(reconciliation) };
  }
}
