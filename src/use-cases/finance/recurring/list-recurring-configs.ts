import {
  type RecurringConfigDTO,
  recurringConfigToDTO,
} from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface ListRecurringConfigsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}

interface ListRecurringConfigsUseCaseResponse {
  configs: RecurringConfigDTO[];
  total: number;
}

export class ListRecurringConfigsUseCase {
  constructor(private recurringConfigsRepository: RecurringConfigsRepository) {}

  async execute(
    request: ListRecurringConfigsUseCaseRequest,
  ): Promise<ListRecurringConfigsUseCaseResponse> {
    const { tenantId, page = 1, limit = 20, type, status, search } = request;

    const result = await this.recurringConfigsRepository.findMany({
      tenantId,
      page,
      limit,
      type,
      status,
      search,
    });

    return {
      configs: result.configs.map(recurringConfigToDTO),
      total: result.total,
    };
  }
}
