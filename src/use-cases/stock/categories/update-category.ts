import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface UpdateCategoryUseCaseRequest {
  id: string;
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

interface UpdateCategoryUseCaseResponse {
  category: import('@/entities/stock/category').Category;
}

export class UpdateCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute({
    id,
    name,
    slug,
    description,
    parentId,
    displayOrder,
    isActive,
  }: UpdateCategoryUseCaseRequest): Promise<UpdateCategoryUseCaseResponse> {
    const category = await this.categoriesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!category) {
      throw new ResourceNotFoundError('Category not found.');
    }

    // Se o nome está sendo atualizado, verifica se já existe outra categoria com esse nome
    if (name && name !== category.name) {
      const categoryWithSameName =
        await this.categoriesRepository.findByName(name);

      if (
        categoryWithSameName &&
        !categoryWithSameName.id.equals(category.id)
      ) {
        throw new BadRequestError('A category with this name already exists.');
      }
    }

    // Se o slug está sendo atualizado, verifica se já existe outra categoria com esse slug
    if (slug && slug !== category.slug) {
      const categoryWithSameSlug =
        await this.categoriesRepository.findBySlug(slug);

      if (
        categoryWithSameSlug &&
        !categoryWithSameSlug.id.equals(category.id)
      ) {
        throw new BadRequestError('A category with this slug already exists.');
      }
    }

    // Se parentId está sendo atualizado, valida se a categoria pai existe
    if (parentId !== undefined) {
      if (parentId === null) {
        // Permite remover o pai (tornar categoria raiz)
      } else if (parentId === id) {
        throw new BadRequestError('A category cannot be its own parent.');
      } else {
        const parentCategory = await this.categoriesRepository.findById(
          new UniqueEntityID(parentId),
        );

        if (!parentCategory) {
          throw new BadRequestError('Parent category not found.');
        }

        // Verifica se o novo pai não é uma subcategoria da categoria atual
        let currentParent = parentCategory;
        while (currentParent.parentId) {
          if (currentParent.parentId.equals(category.id)) {
            throw new BadRequestError(
              'Cannot set a subcategory as parent (circular reference).',
            );
          }
          const nextParent = await this.categoriesRepository.findById(
            currentParent.parentId,
          );
          if (!nextParent) break;
          currentParent = nextParent;
        }
      }
    }

    const updatedCategory = await this.categoriesRepository.update({
      id: new UniqueEntityID(id),
      name,
      slug,
      description,
      parentId:
        parentId === null
          ? null
          : parentId
            ? new UniqueEntityID(parentId)
            : undefined,
      displayOrder,
      isActive,
    });

    if (!updatedCategory) {
      throw new ResourceNotFoundError('Category not found.');
    }

    return {
      category: updatedCategory,
    };
  }
}
