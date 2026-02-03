import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface ListCategoriesUseCaseRequest {
  tenantId: string;
}

interface ListCategoriesUseCaseResponse {
  categories: import('@/entities/stock/category').Category[];
}

export class ListCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    tenantId,
  }: ListCategoriesUseCaseRequest): Promise<ListCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findMany(tenantId);

    return {
      categories,
    };
  }
}
