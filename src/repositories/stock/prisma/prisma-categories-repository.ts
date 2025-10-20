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
        slug: data.slug,
        description: data.description ?? null,
        parentId: data.parentId?.toString(),
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    return Category.create(
      {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description ?? null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: categoryData.displayOrder,
        isActive: categoryData.isActive,
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
        slug: categoryData.slug,
        description: categoryData.description ?? null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: categoryData.displayOrder,
        isActive: categoryData.isActive,
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt,
      },
      new EntityID(categoryData.id),
    );
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const categoryData = await prisma.category.findFirst({
      where: {
        slug: {
          equals: slug,
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
        slug: categoryData.slug,
        description: categoryData.description ?? null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: categoryData.displayOrder,
        isActive: categoryData.isActive,
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
          equals: name,
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
        slug: categoryData.slug,
        description: categoryData.description ?? null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: categoryData.displayOrder,
        isActive: categoryData.isActive,
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
          slug: categoryData.slug,
          description: categoryData.description ?? null,
          parentId: categoryData.parentId
            ? new EntityID(categoryData.parentId)
            : null,
          displayOrder: categoryData.displayOrder,
          isActive: categoryData.isActive,
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
          slug: categoryData.slug,
          description: categoryData.description ?? null,
          parentId: categoryData.parentId
            ? new EntityID(categoryData.parentId)
            : null,
          displayOrder: categoryData.displayOrder,
          isActive: categoryData.isActive,
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
          slug: categoryData.slug,
          description: categoryData.description ?? null,
          parentId: null,
          displayOrder: categoryData.displayOrder,
          isActive: categoryData.isActive,
          createdAt: categoryData.createdAt,
          updatedAt: categoryData.updatedAt,
        },
        new EntityID(categoryData.id),
      ),
    );
  }

  async findManyActive(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });

    return categories.map((categoryData) =>
      Category.create(
        {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description ?? null,
          parentId: categoryData.parentId
            ? new EntityID(categoryData.parentId)
            : null,
          displayOrder: categoryData.displayOrder,
          isActive: categoryData.isActive,
          createdAt: categoryData.createdAt,
          updatedAt: categoryData.updatedAt,
        },
        new EntityID(categoryData.id),
      ),
    );
  }

  async update(data: UpdateCategorySchema): Promise<Category | null> {
    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.parentId !== undefined)
      updateData.parentId = data.parentId?.toString() ?? null;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const categoryData = await prisma.category.update({
      where: {
        id: data.id.toString(),
      },
      data: updateData,
    });

    return Category.create(
      {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description ?? null,
        parentId: categoryData.parentId
          ? new EntityID(categoryData.parentId)
          : null,
        displayOrder: categoryData.displayOrder,
        isActive: categoryData.isActive,
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
        slug: category.slug,
        description: category.description,
        parentId: category.parentId?.toString(),
        displayOrder: category.displayOrder,
        isActive: category.isActive,
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
