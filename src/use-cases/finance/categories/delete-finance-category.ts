import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface DeleteFinanceCategoryUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteFinanceCategoryUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteFinanceCategoryUseCaseRequest): Promise<void> {
    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!category) {
      throw new ResourceNotFoundError('Finance category not found');
    }

    await this.categoriesRepository.delete(new UniqueEntityID(id));
  }
}
