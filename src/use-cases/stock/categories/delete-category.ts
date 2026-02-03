import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface DeleteCategoryUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteCategoryUseCaseResponse {
  message: string;
}

export class DeleteCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteCategoryUseCaseRequest): Promise<DeleteCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!category) {
      throw new ResourceNotFoundError('Category not found.');
    }

    await this.categoriesRepository.delete(new UniqueEntityID(id));

    return {
      message: 'Category deleted successfully.',
    };
  }
}
