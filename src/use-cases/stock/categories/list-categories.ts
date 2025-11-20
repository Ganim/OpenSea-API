import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface ListCategoriesUseCaseResponse {
  categories: import('@/entities/stock/category').Category[];
}

export class ListCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(): Promise<ListCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findMany();

    return {
      categories,
    };
  }
}
