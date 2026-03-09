import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type FinanceCategoryDTO,
  financeCategoryToDTO,
} from '@/mappers/finance/finance-category/finance-category-to-dto';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

const PT_BR_TRANSLITERATION: Record<string, string> = {
  'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
  'ç': 'c', 'ñ': 'n',
};

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, (char) => PT_BR_TRANSLITERATION[char] ?? '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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
      throw new BadRequestError('Category name is required', ErrorCodes.BAD_REQUEST);
    }

    if (name.length > 128) {
      throw new BadRequestError('Category name must be at most 128 characters', ErrorCodes.BAD_REQUEST);
    }

    const validTypes = ['EXPENSE', 'REVENUE', 'BOTH'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(
        'Category type must be EXPENSE, REVENUE, or BOTH',
        ErrorCodes.BAD_REQUEST,
      );
    }

    // Generate slug if not provided (with PT-BR transliteration)
    const slug = request.slug || slugify(name);

    const existingSlug = await this.categoriesRepository.findBySlug(
      slug,
      tenantId,
    );
    if (existingSlug) {
      throw new BadRequestError(
        'A category with this slug already exists',
        ErrorCodes.FINANCE_CATEGORY_DUPLICATE_SLUG,
      );
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
