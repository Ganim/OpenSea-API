import {
  type FinanceCategoryDTO,
  financeCategoryToDTO,
} from '@/mappers/finance/finance-category/finance-category-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface ListFinanceCategoriesUseCaseRequest {
  tenantId: string;
  // P1-36: filters forwarded from the controller.
  type?: string;
  isActive?: boolean;
  parentId?: string;
}

interface ListFinanceCategoriesUseCaseResponse {
  categories: FinanceCategoryDTO[];
}

export class ListFinanceCategoriesUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute({
    tenantId,
    type,
    isActive,
    parentId,
  }: ListFinanceCategoriesUseCaseRequest): Promise<ListFinanceCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findMany(tenantId, {
      type,
      isActive,
      parentId,
    });
    return { categories: categories.map(financeCategoryToDTO) };
  }
}
