import {
  CategoryDTO,
  categoryToDTO,
} from '@/mappers/stock/category/category-to-dto';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface ListCategoriesUseCaseResponse {
  categories: CategoryDTO[];
}

export class ListCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(): Promise<ListCategoriesUseCaseResponse> {
    const categories = await this.categoriesRepository.findMany();

    return {
      categories: categories.map(categoryToDTO),
    };
  }
}
