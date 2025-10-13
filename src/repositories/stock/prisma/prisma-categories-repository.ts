import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Category } from '@/entities/stock/category';
import { prisma } from '@/lib/prisma';
import type {
  CategoriesRepository,
  CreateCategorySchema,
  UpdateCategorySchema,
} from '../categories-repository';

export class PrismaCategoriesRepository implements CategoriesRepository {
  async create(data: CreateCategorySchema): Promise<Category> {
    const categoryData = await prisma.category.create({
      data: {
        name: data.name,
        parentId: data.parentId?.toString(),
      },
    });

    return Category.create(
      {
        name: categoryData.name,
        slug: data.slug,
        description: null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt,
      },
      new EntityID(categoryData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Category | null> {
    const categoryData = await prisma.category.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!categoryData) {
      return null;
    }

    return Category.create(
      {
        name: categoryData.name,
        slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        description: null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: 0,
        isActive: true,
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt,
      },
      new EntityID(categoryData.id),
    );
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const categoryData = await prisma.category.findFirst({
      where: {
        name: {
          contains: slug.replace(/-/g, ' '),
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (!categoryData) {
      return null;
    }

    return Category.create(
      {
        name: categoryData.name,
        slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        description: null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: 0,
        isActive: true,
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt,
      },
      new EntityID(categoryData.id),
    );
  }

  async findByName(name: string): Promise<Category | null> {
    const categoryData = await prisma.category.findFirst({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    });

    if (!categoryData) {
      return null;
    }

    return Category.create(
      {
        name: categoryData.name,
        slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        description: null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: 0,
        isActive: true,
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt,
      },
      new EntityID(categoryData.id),
    );
  }

  async findMany(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        deletedAt: null,
      },
    });

    return categories.map((categoryData) =>
      Category.create(
        {
          name: categoryData.name,
          slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          description: null,
          parentId: categoryData.parentId
            ? new EntityID(categoryData.parentId)
            : null,
          displayOrder: 0,
          isActive: true,
          createdAt: categoryData.createdAt,
          updatedAt: categoryData.updatedAt,
        },
        new EntityID(categoryData.id),
      ),
    );
  }

  async findManyByParent(parentId: UniqueEntityID): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        parentId: parentId.toString(),
        deletedAt: null,
      },
    });

    return categories.map((categoryData) =>
      Category.create(
        {
          name: categoryData.name,
          slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          description: null,
          parentId: categoryData.parentId
            ? new EntityID(categoryData.parentId)
            : null,
          displayOrder: 0,
          isActive: true,
          createdAt: categoryData.createdAt,
          updatedAt: categoryData.updatedAt,
        },
        new EntityID(categoryData.id),
      ),
    );
  }

  async findManyRootCategories(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        deletedAt: null,
      },
    });

    return categories.map((categoryData) =>
      Category.create(
        {
          name: categoryData.name,
          slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          description: null,
          parentId: null,
          displayOrder: 0,
          isActive: true,
          createdAt: categoryData.createdAt,
          updatedAt: categoryData.updatedAt,
        },
        new EntityID(categoryData.id),
      ),
    );
  }

  async findManyActive(): Promise<Category[]> {
    // Como o schema não tem campo isActive, retorna todas
    return this.findMany();
  }

  async update(data: UpdateCategorySchema): Promise<Category | null> {
    const categoryData = await prisma.category.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        name: data.name,
        parentId: data.parentId?.toString(),
      },
    });

    return Category.create(
      {
        name: categoryData.name,
        slug: data.slug ?? categoryData.name.toLowerCase().replace(/\s+/g, '-'),
        description: null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt,
      },
      new EntityID(categoryData.id),
    );
  }

  async save(category: Category): Promise<void> {
    await prisma.category.update({
      where: {
        id: category.categoryId.toString(),
      },
      data: {
        name: category.name,
        parentId: category.parentId?.toString(),
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.category.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
