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
  /**
   * When true, allows completing the reconciliation even if there are still
   * unmatched items. Intended for callers (admin/override flows) that need to
   * explicitly accept the remaining pending items. Defaults to false.
   */
  force?: boolean;
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
    const { tenantId, reconciliationId, force = false } = request;

    const reconciliationWithItems =
      await this.bankReconciliationsRepository.findById(
        new UniqueEntityID(reconciliationId),
        tenantId,
        true,
      );

    if (!reconciliationWithItems) {
      throw new ResourceNotFoundError(
        'Reconciliation not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    if (reconciliationWithItems.isCompleted) {
      throw new BadRequestError(
        'Reconciliation is already completed',
        ErrorCodes.BAD_REQUEST,
      );
    }

    if (!force) {
      const pendingItemsCount = (reconciliationWithItems.items ?? []).filter(
        (reconciliationItem) => reconciliationItem.matchStatus === 'UNMATCHED',
      ).length;

      const hasPendingItems =
        pendingItemsCount > 0 || reconciliationWithItems.unmatchedCount > 0;

      if (hasPendingItems) {
        throw new BadRequestError(
          'Não é possível finalizar conciliação com itens pendentes',
          ErrorCodes.BAD_REQUEST,
        );
      }
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
