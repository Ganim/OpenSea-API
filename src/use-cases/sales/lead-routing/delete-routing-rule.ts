import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LeadRoutingRulesRepository } from '@/repositories/sales/lead-routing-rules-repository';

interface DeleteRoutingRuleUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteRoutingRuleUseCaseResponse {
  message: string;
}

export class DeleteRoutingRuleUseCase {
  constructor(private leadRoutingRulesRepository: LeadRoutingRulesRepository) {}

  async execute(
    request: DeleteRoutingRuleUseCaseRequest,
  ): Promise<DeleteRoutingRuleUseCaseResponse> {
    const routingRule = await this.leadRoutingRulesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!routingRule) {
      throw new ResourceNotFoundError('Routing rule not found.');
    }

    await this.leadRoutingRulesRepository.delete(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    return { message: 'Routing rule deleted successfully.' };
  }
}
