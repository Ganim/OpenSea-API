import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type BankReconciliationDTO,
  bankReconciliationToDTO,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-to-dto';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface CompleteReconciliationUseCaseRequest {
  tenantId: string;
  reconciliationId: string;
}

interface CompleteReconciliationUseCaseResponse {
  reconciliation: BankReconciliationDTO;
}

export class CompleteReconciliationUseCase {
  constructor(
    private bankReconciliationsRepository: BankReconciliationsRepository,
  ) {}

  async execute(
    request: CompleteReconciliationUseCaseRequest,
  ): Promise<CompleteReconciliationUseCaseResponse> {
    const { tenantId, reconciliationId } = request;

    const reconciliation = await this.bankReconciliationsRepository.findById(
      new UniqueEntityID(reconciliationId),
      tenantId,
    );

    if (!reconciliation) {
      throw new ResourceNotFoundError(
        'Reconciliation not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    if (reconciliation.isCompleted) {
      throw new BadRequestError(
        'Reconciliation is already completed',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const updatedReconciliation =
      await this.bankReconciliationsRepository.update({
        id: new UniqueEntityID(reconciliationId),
        tenantId,
        status: 'COMPLETED',
      });

    return {
      reconciliation: bankReconciliationToDTO(updatedReconciliation!),
    };
  }
}
