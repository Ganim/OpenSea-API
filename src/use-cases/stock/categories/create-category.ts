import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CategoriesRepository } from '@/repositories/stock/categories-repository';

interface CreateCategoryUseCaseRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

interface CreateCategoryUseCaseResponse {
  category: import('@/entities/stock/category').Category;
}

export class CreateCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async execute({
    name,
    slug,
    description,
    parentId,
    displayOrder,
    isActive = true,
  }: CreateCategoryUseCaseRequest): Promise<CreateCategoryUseCaseResponse> {
    // Gera slug se não foi fornecido
    const categorySlug = slug || this.generateSlug(name);

    // Verifica se já existe uma categoria com o mesmo nome
    const categoryWithSameName =
      await this.categoriesRepository.findByName(name);

    if (categoryWithSameName) {
      throw new BadRequestError('A category with this name already exists.');
    }

    // Verifica se já existe uma categoria com o mesmo slug
    const categoryWithSameSlug =
      await this.categoriesRepository.findBySlug(categorySlug);

    if (categoryWithSameSlug) {
      throw new BadRequestError('A category with this slug already exists.');
    }

    // Se parentId foi fornecido, valida se a categoria pai existe
    if (parentId) {
      const parentCategory = await this.categoriesRepository.findById(
        new UniqueEntityID(parentId),
      );

      if (!parentCategory) {
        throw new BadRequestError('Parent category not found.');
      }
    }

    const newCategory = await this.categoriesRepository.create({
      name,
      slug: categorySlug,
      description,
      parentId: parentId ? new UniqueEntityID(parentId) : undefined,
      displayOrder,
      isActive,
    });

    return {
      category: newCategory,
    };
  }
}
