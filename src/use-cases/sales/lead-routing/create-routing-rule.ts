import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type {
  LeadRoutingRule,
  LeadRoutingStrategy,
} from '@/entities/sales/lead-routing-rule';
import type { LeadRoutingRulesRepository } from '@/repositories/sales/lead-routing-rules-repository';

interface CreateRoutingRuleUseCaseRequest {
  tenantId: string;
  name: string;
  strategy: LeadRoutingStrategy;
  config?: Record<string, unknown>;
  assignToUsers?: string[];
  maxLeadsPerUser?: number;
  isActive?: boolean;
}

interface CreateRoutingRuleUseCaseResponse {
  routingRule: LeadRoutingRule;
}

export class CreateRoutingRuleUseCase {
  constructor(private leadRoutingRulesRepository: LeadRoutingRulesRepository) {}

  async execute(
    request: CreateRoutingRuleUseCaseRequest,
  ): Promise<CreateRoutingRuleUseCaseResponse> {
    if (!request.name || request.name.trim().length === 0) {
      throw new BadRequestError('Routing rule name is required.');
    }

    if (
      request.strategy === 'ROUND_ROBIN' &&
      (!request.assignToUsers || request.assignToUsers.length === 0)
    ) {
      throw new BadRequestError(
        'ROUND_ROBIN strategy requires at least one user in assignToUsers.',
      );
    }

    if (
      request.strategy === 'LOAD_BALANCE' &&
      (!request.assignToUsers || request.assignToUsers.length === 0)
    ) {
      throw new BadRequestError(
        'LOAD_BALANCE strategy requires at least one user in assignToUsers.',
      );
    }

    const routingRule = await this.leadRoutingRulesRepository.create({
      tenantId: request.tenantId,
      name: request.name.trim(),
      strategy: request.strategy,
      config: request.config,
      assignToUsers: request.assignToUsers,
      maxLeadsPerUser: request.maxLeadsPerUser,
      isActive: request.isActive,
    });

    return { routingRule };
  }
}
