import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Tag } from '@/entities/stock/tag';
import { prisma } from '@/lib/prisma';
import type {
  CreateTagSchema,
  TagsRepository,
  UpdateTagSchema,
} from '../tags-repository';

export class PrismaTagsRepository implements TagsRepository {
  async create(data: CreateTagSchema): Promise<Tag> {
    const tagData = await prisma.tag.create({
      data: {
        name: data.name,
        slug: data.slug,
        color: data.color,
        description: data.description,
      },
    });

    return Tag.create(
      {
        name: tagData.name,
        slug: tagData.slug,
        color: tagData.color,
        description: tagData.description,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
      },
      new EntityID(tagData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Tag | null> {
    const tagData = await prisma.tag.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!tagData) {
      return null;
    }

    return Tag.create(
      {
        name: tagData.name,
        slug: tagData.slug,
        color: tagData.color,
        description: tagData.description,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
      },
      new EntityID(tagData.id),
    );
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const tagData = await prisma.tag.findUnique({
      where: {
        slug,
        deletedAt: null,
      },
    });

    if (!tagData) {
      return null;
    }

    return Tag.create(
      {
        name: tagData.name,
        slug: tagData.slug,
        color: tagData.color,
        description: tagData.description,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
      },
      new EntityID(tagData.id),
    );
  }

  async findByName(name: string): Promise<Tag | null> {
    const tagData = await prisma.tag.findUnique({
      where: {
        name,
        deletedAt: null,
      },
    });

    if (!tagData) {
      return null;
    }

    return Tag.create(
      {
        name: tagData.name,
        slug: tagData.slug,
        color: tagData.color,
        description: tagData.description,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
      },
      new EntityID(tagData.id),
    );
  }

  async findMany(): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      where: {
        deletedAt: null,
      },
    });

    return tags.map((tagData) =>
      Tag.create(
        {
          name: tagData.name,
          slug: tagData.slug,
          color: tagData.color,
          description: tagData.description,
          createdAt: tagData.createdAt,
          updatedAt: tagData.updatedAt,
        },
        new EntityID(tagData.id),
      ),
    );
  }

  async findManyByNames(names: string[]): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          in: names,
        },
        deletedAt: null,
      },
    });

    return tags.map((tagData) =>
      Tag.create(
        {
          name: tagData.name,
          slug: tagData.slug,
          color: tagData.color,
          description: tagData.description,
          createdAt: tagData.createdAt,
          updatedAt: tagData.updatedAt,
        },
        new EntityID(tagData.id),
      ),
    );
  }

  async update(data: UpdateTagSchema): Promise<Tag | null> {
    const tagData = await prisma.tag.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        name: data.name,
        slug: data.slug,
        color: data.color,
        description: data.description,
      },
    });

    return Tag.create(
      {
        name: tagData.name,
        slug: tagData.slug,
        color: tagData.color,
        description: tagData.description,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
      },
      new EntityID(tagData.id),
    );
  }

  async save(tag: Tag): Promise<void> {
    await prisma.tag.update({
      where: {
        id: tag.tagId.toString(),
      },
      data: {
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        description: tag.description,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.tag.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
