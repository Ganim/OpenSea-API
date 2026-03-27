import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LeadRoutingRule } from '@/entities/sales/lead-routing-rule';
import type { LeadRoutingRulesRepository } from '@/repositories/sales/lead-routing-rules-repository';

interface GetRoutingRuleByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetRoutingRuleByIdUseCaseResponse {
  routingRule: LeadRoutingRule;
}

export class GetRoutingRuleByIdUseCase {
  constructor(private leadRoutingRulesRepository: LeadRoutingRulesRepository) {}

  async execute(
    request: GetRoutingRuleByIdUseCaseRequest,
  ): Promise<GetRoutingRuleByIdUseCaseResponse> {
    const routingRule = await this.leadRoutingRulesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!routingRule) {
      throw new ResourceNotFoundError('Routing rule not found.');
    }

    return { routingRule };
  }
}
