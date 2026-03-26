import type { DiscountRuleDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { discountRuleToDTO } from '@/mappers/sales/discount-rule/discount-rule-to-dto';
import { DiscountRulesRepository } from '@/repositories/sales/discount-rules-repository';

interface ListDiscountRulesUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
}

interface ListDiscountRulesUseCaseResponse {
  discountRules: DiscountRuleDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListDiscountRulesUseCase {
  constructor(private discountRulesRepository: DiscountRulesRepository) {}

  async execute(
    input: ListDiscountRulesUseCaseRequest,
  ): Promise<ListDiscountRulesUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [discountRules, total] = await Promise.all([
      this.discountRulesRepository.findMany(page, perPage, input.tenantId),
      this.discountRulesRepository.countByTenant(input.tenantId),
    ]);

    return {
      discountRules: discountRules.map(discountRuleToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
