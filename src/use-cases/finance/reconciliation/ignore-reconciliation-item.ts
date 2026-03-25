import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type BankReconciliationItemDTO,
  bankReconciliationItemToDTO,
} from '@/mappers/finance/bank-reconciliation/bank-reconciliation-to-dto';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface IgnoreReconciliationItemUseCaseRequest {
  tenantId: string;
  reconciliationId: string;
  itemId: string;
}

interface IgnoreReconciliationItemUseCaseResponse {
  item: BankReconciliationItemDTO;
}

export class IgnoreReconciliationItemUseCase {
  constructor(
    private bankReconciliationsRepository: BankReconciliationsRepository,
  ) {}

  async execute(
    request: IgnoreReconciliationItemUseCaseRequest,
  ): Promise<IgnoreReconciliationItemUseCaseResponse> {
    const { tenantId, reconciliationId, itemId } = request;

    // Validate reconciliation exists
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
        'Cannot modify a completed reconciliation',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Validate item exists
    const item = await this.bankReconciliationsRepository.findItemById(
      new UniqueEntityID(itemId),
      reconciliationId,
    );

    if (!item) {
      throw new ResourceNotFoundError(
        'Reconciliation item not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Mark as ignored
    const updatedItem = await this.bankReconciliationsRepository.updateItem({
      id: new UniqueEntityID(itemId),
      matchedEntryId: null,
      matchConfidence: null,
      matchStatus: 'IGNORED',
    });

    // Recalculate counts
    const fullReconciliation =
      await this.bankReconciliationsRepository.findById(
        new UniqueEntityID(reconciliationId),
        tenantId,
        true,
      );

    if (fullReconciliation?.items) {
      const matchedCount = fullReconciliation.items.filter(
        (i) => i.isMatched || i.matchStatus === 'CREATED',
      ).length;
      const unmatchedCount = fullReconciliation.items.filter(
        (i) => i.isUnmatched,
      ).length;

      await this.bankReconciliationsRepository.update({
        id: new UniqueEntityID(reconciliationId),
        tenantId,
        matchedCount,
        unmatchedCount,
      });
    }

    return { item: bankReconciliationItemToDTO(updatedItem!) };
  }
}
