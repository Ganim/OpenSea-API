import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface CancelFinanceEntryUseCaseRequest {
  tenantId: string;
  id: string;
}

interface CancelFinanceEntryUseCaseResponse {
  entry: FinanceEntryDTO;
}

export class CancelFinanceEntryUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    { tenantId, id }: CancelFinanceEntryUseCaseRequest,
  ): Promise<CancelFinanceEntryUseCaseResponse> {
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    if (entry.status === 'PAID' || entry.status === 'RECEIVED') {
      throw new BadRequestError('Cannot cancel an entry that is already paid or received');
    }

    const cancelled = await this.financeEntriesRepository.update({
      id: new UniqueEntityID(id),
      status: 'CANCELLED',
    });

    if (!cancelled) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    return { entry: financeEntryToDTO(cancelled) };
  }
}
