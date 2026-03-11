import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

interface DeleteFinanceCategoryUseCaseRequest {
  tenantId: string;
  id: string;
  replacementCategoryId?: string;
}

export class DeleteFinanceCategoryUseCase {
  constructor(private categoriesRepository: FinanceCategoriesRepository) {}

  async execute({
    tenantId,
    id,
    replacementCategoryId,
  }: DeleteFinanceCategoryUseCaseRequest): Promise<void> {
    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!category) {
      throw new ResourceNotFoundError(
        'Finance category not found',
        ErrorCodes.FINANCE_CATEGORY_NOT_FOUND,
      );
    }

    // System categories cannot be deleted
    if (category.isSystem) {
      throw new BadRequestError(
        'System categories cannot be deleted',
        ErrorCodes.FINANCE_CATEGORY_IS_SYSTEM,
      );
    }

    // Check if category has children
    const children = await this.categoriesRepository.findByParentId(
      category.id,
      tenantId,
    );
    if (children.length > 0) {
      throw new BadRequestError(
        'Cannot delete a category that has child categories. Delete or move children first.',
        ErrorCodes.FINANCE_CATEGORY_HAS_CHILDREN,
      );
    }

    // Check if category has linked entries
    const entryCount = await this.categoriesRepository.countEntriesByCategoryId(
      id,
      tenantId,
    );

    if (entryCount > 0) {
      if (!replacementCategoryId) {
        throw new BadRequestError(
          'This category has linked entries. Provide a replacement category to migrate entries before deletion.',
          ErrorCodes.FINANCE_CATEGORY_REPLACEMENT_REQUIRED,
        );
      }

      if (replacementCategoryId === id) {
        throw new BadRequestError(
          'Replacement category cannot be the same as the category being deleted',
          ErrorCodes.FINANCE_CATEGORY_SELF_REPLACEMENT,
        );
      }

      const replacement = await this.categoriesRepository.findById(
        new UniqueEntityID(replacementCategoryId),
        tenantId,
      );

      if (!replacement) {
        throw new ResourceNotFoundError(
          'Replacement category not found',
          ErrorCodes.FINANCE_CATEGORY_REPLACEMENT_NOT_FOUND,
        );
      }

      // Migrate entries then soft-delete
      await this.categoriesRepository.migrateEntries(
        id,
        replacementCategoryId,
        tenantId,
      );
    }

    await this.categoriesRepository.delete(new UniqueEntityID(id));
  }
}
