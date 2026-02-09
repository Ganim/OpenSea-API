import {
  type FinanceCategoryDTO,
  financeCategoryToDTO,
} from '@/mappers/finance/finance-category/finance-category-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface ListFinanceCategoriesUseCaseRequest {
  tenantId: string;
}

interface ListFinanceCategoriesUseCaseResponse {
  categories: FinanceCategoryDTO[];
}

export class ListFinanceCategoriesUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute({
    tenantId,
  }: ListFinanceCategoriesUseCaseRequest): Promise<ListFinanceCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findMany(tenantId);
    return { categories: categories.map(financeCategoryToDTO) };
  }
}
