import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface DeleteFinanceEntryUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteFinanceEntryUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute({ tenantId, id }: DeleteFinanceEntryUseCaseRequest): Promise<void> {
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const undeletableStatuses = ['PAID', 'RECEIVED'];
    if (undeletableStatuses.includes(entry.status)) {
      throw new BadRequestError('Cannot delete an entry with status ' + entry.status);
    }

    await this.financeEntriesRepository.delete(new UniqueEntityID(id));
  }
}
