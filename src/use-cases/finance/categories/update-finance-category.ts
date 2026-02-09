import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type FinanceCategoryDTO,
  financeCategoryToDTO,
} from '@/mappers/finance/finance-category/finance-category-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface UpdateFinanceCategoryUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  type?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

interface UpdateFinanceCategoryUseCaseResponse {
  category: FinanceCategoryDTO;
}

export class UpdateFinanceCategoryUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute(
    request: UpdateFinanceCategoryUseCaseRequest,
  ): Promise<UpdateFinanceCategoryUseCaseResponse> {
    const { tenantId, id, name, slug, type } = request;

    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!category) {
      throw new ResourceNotFoundError('Finance category not found');
    }

    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new BadRequestError('Category name cannot be empty');
      }
      if (name.length > 128) {
        throw new BadRequestError(
          'Category name must be at most 128 characters',
        );
      }
    }

    if (type !== undefined) {
      const validTypes = ['EXPENSE', 'REVENUE', 'BOTH'];
      if (!validTypes.includes(type)) {
        throw new BadRequestError(
          'Category type must be EXPENSE, REVENUE, or BOTH',
        );
      }
    }

    if (slug !== undefined) {
      const existingSlug = await this.categoriesRepository.findBySlug(
        slug,
        tenantId,
      );
      if (existingSlug && !existingSlug.id.equals(category.id)) {
        throw new BadRequestError('A category with this slug already exists');
      }
    }

    const updated = await this.categoriesRepository.update({
      id: new UniqueEntityID(id),
      name: name?.trim(),
      slug,
      description: request.description,
      iconUrl: request.iconUrl,
      color: request.color,
      type,
      parentId: request.parentId,
      displayOrder: request.displayOrder,
      isActive: request.isActive,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Finance category not found');
    }

    return { category: financeCategoryToDTO(updated) };
  }
}
