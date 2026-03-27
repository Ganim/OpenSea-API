import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  LeadRoutingRule,
  LeadRoutingStrategy,
} from '@/entities/sales/lead-routing-rule';
import type { LeadRoutingRulesRepository } from '@/repositories/sales/lead-routing-rules-repository';

interface UpdateRoutingRuleUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  strategy?: LeadRoutingStrategy;
  config?: Record<string, unknown>;
  assignToUsers?: string[];
  maxLeadsPerUser?: number | null;
  isActive?: boolean;
}

interface UpdateRoutingRuleUseCaseResponse {
  routingRule: LeadRoutingRule;
}

export class UpdateRoutingRuleUseCase {
  constructor(private leadRoutingRulesRepository: LeadRoutingRulesRepository) {}

  async execute(
    request: UpdateRoutingRuleUseCaseRequest,
  ): Promise<UpdateRoutingRuleUseCaseResponse> {
    const existing = await this.leadRoutingRulesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Routing rule not found.');
    }

    const routingRule = await this.leadRoutingRulesRepository.update({
      id: new UniqueEntityID(request.id),
      tenantId: request.tenantId,
      name: request.name,
      strategy: request.strategy,
      config: request.config,
      assignToUsers: request.assignToUsers,
      maxLeadsPerUser: request.maxLeadsPerUser,
      isActive: request.isActive,
    });

    if (!routingRule) {
      throw new ResourceNotFoundError('Routing rule not found.');
    }

    return { routingRule };
  }
}
