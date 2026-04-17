import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type BankReconciliationDTO,
  bankReconciliationToDTO,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-to-dto';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';

interface CancelReconciliationUseCaseRequest {
  tenantId: string;
  reconciliationId: string;
}

interface CancelReconciliationUseCaseResponse {
  reconciliation: BankReconciliationDTO;
}

export class CancelReconciliationUseCase {
  constructor(
    private bankReconciliationsRepository: BankReconciliationsRepository,
  ) {}

  async execute(
    request: CancelReconciliationUseCaseRequest,
  ): Promise<CancelReconciliationUseCaseResponse> {
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

    if (reconciliation.status === 'COMPLETED') {
      throw new BadRequestError(
        'Reconciliation is already completed',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (reconciliation.status === 'CANCELLED') {
      throw new BadRequestError(
        'Reconciliation is already cancelled',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const updated = await this.bankReconciliationsRepository.update({
      id: new UniqueEntityID(reconciliationId),
      tenantId,
      status: 'CANCELLED',
    });

    return {
      reconciliation: bankReconciliationToDTO(updated!),
    };
  }
}
