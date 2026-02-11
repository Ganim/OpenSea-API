import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type FinanceCategoryDTO,
  financeCategoryToDTO,
} from '@/mappers/finance/finance-category/finance-category-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface CreateFinanceCategoryUseCaseRequest {
  tenantId: string;
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  type: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

interface CreateFinanceCategoryUseCaseResponse {
  category: FinanceCategoryDTO;
}

export class CreateFinanceCategoryUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute(
    request: CreateFinanceCategoryUseCaseRequest,
  ): Promise<CreateFinanceCategoryUseCaseResponse> {
    const { tenantId, name, type } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Category name is required');
    }

    if (name.length > 128) {
      throw new BadRequestError('Category name must be at most 128 characters');
    }

    const validTypes = ['EXPENSE', 'REVENUE', 'BOTH'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(
        'Category type must be EXPENSE, REVENUE, or BOTH',
      );
    }

    // Generate slug if not provided
    const slug =
      request.slug ||
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    const existingSlug = await this.categoriesRepository.findBySlug(
      slug,
      tenantId,
    );
    if (existingSlug) {
      throw new BadRequestError('A category with this slug already exists');
    }

    const category = await this.categoriesRepository.create({
      tenantId,
      name: name.trim(),
      slug,
      description: request.description,
      iconUrl: request.iconUrl,
      color: request.color,
      type,
      parentId: request.parentId,
      displayOrder: request.displayOrder,
      isActive: request.isActive,
    });

    return { category: financeCategoryToDTO(category) };
  }
}
