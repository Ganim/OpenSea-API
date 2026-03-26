import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DiscountRulesRepository } from '@/repositories/sales/discount-rules-repository';

interface DeleteDiscountRuleUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteDiscountRuleUseCaseResponse {
  message: string;
}

export class DeleteDiscountRuleUseCase {
  constructor(private discountRulesRepository: DiscountRulesRepository) {}

  async execute(
    input: DeleteDiscountRuleUseCaseRequest,
  ): Promise<DeleteDiscountRuleUseCaseResponse> {
    const discountRule = await this.discountRulesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!discountRule) {
      throw new ResourceNotFoundError('Discount rule not found.');
    }

    discountRule.delete();
    await this.discountRulesRepository.save(discountRule);

    return {
      message: 'Discount rule deleted successfully.',
    };
  }
}
