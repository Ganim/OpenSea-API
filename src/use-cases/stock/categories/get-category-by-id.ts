import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CategoryDTO,
  categoryToDTO,
} from '@/mappers/stock/category/category-to-dto';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface GetCategoryByIdUseCaseRequest {
  id: string;
}

interface GetCategoryByIdUseCaseResponse {
  category: CategoryDTO;
}

export class GetCategoryByIdUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    id,
  }: GetCategoryByIdUseCaseRequest): Promise<GetCategoryByIdUseCaseResponse> {
    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!category) {
      throw new ResourceNotFoundError('Category not found.');
    }

    return {
      category: categoryToDTO(category),
    };
  }
}
