import {
  type RecurringConfigDTO,
  recurringConfigToDTO,
} from '@/mappers/finance/recurring-config/recurring-config-to-dto';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface ListRecurringConfigsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'description' | 'baseAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
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
    const {
      tenantId,
      page = 1,
      limit = 20,
      sortBy,
      sortOrder,
      type,
      status,
      search,
    } = request;

    const result = await this.recurringConfigsRepository.findMany({
      tenantId,
      page,
      limit,
      sortBy,
      sortOrder,
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
