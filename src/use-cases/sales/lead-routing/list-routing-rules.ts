import type {
  LeadRoutingRule,
  LeadRoutingStrategy,
} from '@/entities/sales/lead-routing-rule';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { LeadRoutingRulesRepository } from '@/repositories/sales/lead-routing-rules-repository';

interface ListRoutingRulesUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  strategy?: LeadRoutingStrategy;
  isActive?: boolean;
}

interface ListRoutingRulesUseCaseResponse {
  routingRules: PaginatedResult<LeadRoutingRule>;
}

export class ListRoutingRulesUseCase {
  constructor(private leadRoutingRulesRepository: LeadRoutingRulesRepository) {}

  async execute(
    request: ListRoutingRulesUseCaseRequest,
  ): Promise<ListRoutingRulesUseCaseResponse> {
    const routingRules =
      await this.leadRoutingRulesRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        search: request.search,
        strategy: request.strategy,
        isActive: request.isActive,
      });

    return { routingRules };
  }
}
