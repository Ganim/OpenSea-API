import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface DeleteCostCenterUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteCostCenterUseCase {
  constructor(
    private costCentersRepository: CostCentersRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: DeleteCostCenterUseCaseRequest): Promise<void> {
    const costCenter = await this.costCentersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!costCenter) {
      throw new ResourceNotFoundError(
        'Cost center not found',
        ErrorCodes.FINANCE_COST_CENTER_NOT_FOUND,
      );
    }

    const pendingEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      costCenterId: id,
      status: 'PENDING',
      limit: 1,
    });

    const overdueEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      costCenterId: id,
      status: 'OVERDUE',
      limit: 1,
    });

    const partiallyPaidEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      costCenterId: id,
      status: 'PARTIALLY_PAID',
      limit: 1,
    });

    const scheduledEntries = await this.financeEntriesRepository.findMany({
      tenantId,
      costCenterId: id,
      status: 'SCHEDULED',
      limit: 1,
    });

    const hasActiveEntries =
      pendingEntries.total > 0 ||
      overdueEntries.total > 0 ||
      partiallyPaidEntries.total > 0 ||
      scheduledEntries.total > 0;

    if (hasActiveEntries) {
      throw new BadRequestError(
        'Centro de custo possui lançamentos vinculados e não pode ser excluído',
      );
    }

    await this.costCentersRepository.delete(new UniqueEntityID(id), tenantId);
  }
}
