import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface GetCategoryByIdUseCaseRequest {
  id: string;
}

interface GetCategoryByIdUseCaseResponse {
  category: import('@/entities/stock/category').Category;
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
      category,
    };
  }
}
