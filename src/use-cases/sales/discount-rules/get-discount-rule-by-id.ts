import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DiscountRuleDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { discountRuleToDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { DiscountRulesRepository } from '@/repositories/sales/discount-rules-repository';

interface GetDiscountRuleByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetDiscountRuleByIdUseCaseResponse {
  discountRule: DiscountRuleDTO;
}

export class GetDiscountRuleByIdUseCase {
  constructor(private discountRulesRepository: DiscountRulesRepository) {}

  async execute(
    input: GetDiscountRuleByIdUseCaseRequest,
  ): Promise<GetDiscountRuleByIdUseCaseResponse> {
    const discountRule = await this.discountRulesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!discountRule) {
      throw new ResourceNotFoundError('Discount rule not found.');
    }

    return {
      discountRule: discountRuleToDTO(discountRule),
    };
  }
}
