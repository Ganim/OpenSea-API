import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type OverdueActionDTO,
  overdueActionToDTO,
} from '@/mappers/finance/overdue-action/overdue-action-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { OverdueActionsRepository } from '@/repositories/finance/overdue-actions-repository';

interface GetEntryEscalationHistoryUseCaseRequest {
  entryId: string;
  tenantId: string;
}

interface GetEntryEscalationHistoryUseCaseResponse {
  actions: OverdueActionDTO[];
}

export class GetEntryEscalationHistoryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private overdueActionsRepository: OverdueActionsRepository,
  ) {}

  async execute(
    request: GetEntryEscalationHistoryUseCaseRequest,
  ): Promise<GetEntryEscalationHistoryUseCaseResponse> {
    const { entryId, tenantId } = request;

    // Verify entry exists
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const actions = await this.overdueActionsRepository.findByEntryId(
      entryId,
      tenantId,
    );

    return {
      actions: actions.map(overdueActionToDTO),
    };
  }
}
