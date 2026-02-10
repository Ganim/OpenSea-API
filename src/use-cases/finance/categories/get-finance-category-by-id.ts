import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceCategoryDTO,
  financeCategoryToDTO,
} from '@/mappers/finance/finance-category/finance-category-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface GetFinanceCategoryByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetFinanceCategoryByIdUseCaseResponse {
  category: FinanceCategoryDTO;
}

export class GetFinanceCategoryByIdUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute({
    tenantId,
    id,
  }: GetFinanceCategoryByIdUseCaseRequest): Promise<GetFinanceCategoryByIdUseCaseResponse> {
    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!category) {
      throw new ResourceNotFoundError('Finance category not found');
    }

    return { category: financeCategoryToDTO(category) };
  }
}
