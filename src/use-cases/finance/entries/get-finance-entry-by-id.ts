import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import {
  type FinanceEntryPaymentDTO,
  financeEntryPaymentToDTO,
} from '@/mappers/finance/finance-entry-payment/finance-entry-payment-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';

interface GetFinanceEntryByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetFinanceEntryByIdUseCaseResponse {
  entry: FinanceEntryDTO;
  payments: FinanceEntryPaymentDTO[];
}

export class GetFinanceEntryByIdUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
  ) {}

  async execute(
    { tenantId, id }: GetFinanceEntryByIdUseCaseRequest,
  ): Promise<GetFinanceEntryByIdUseCaseResponse> {
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const payments = await this.financeEntryPaymentsRepository.findByEntryId(
      new UniqueEntityID(id),
    );

    return {
      entry: financeEntryToDTO(entry),
      payments: payments.map(financeEntryPaymentToDTO),
    };
  }
}
