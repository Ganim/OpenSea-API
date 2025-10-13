import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Tag } from '@/entities/stock/tag';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface CreateTagUseCaseRequest {
  name: string;
  slug?: string;
  color?: string;
  description?: string;
}

interface CreateTagUseCaseResponse {
  tag: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class CreateTagUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute({
    name,
    slug,
    color,
    description,
  }: CreateTagUseCaseRequest): Promise<CreateTagUseCaseResponse> {
    // Validate name
    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Tag name is required');
    }

    if (name.length > 100) {
      throw new BadRequestError('Tag name must be at most 100 characters');
    }

    // Check if tag name already exists
    const tagWithSameName = await this.tagsRepository.findByName(name);
    if (tagWithSameName) {
      throw new BadRequestError('A tag with this name already exists');
    }

    // Generate slug if not provided
    const tagSlug = slug || Tag.generateSlug(name);

    // Validate slug
    if (tagSlug.length > 100) {
      throw new BadRequestError('Tag slug must be at most 100 characters');
    }

    // Check if slug already exists
    const tagWithSameSlug = await this.tagsRepository.findBySlug(tagSlug);
    if (tagWithSameSlug) {
      throw new BadRequestError('A tag with this slug already exists');
    }

    // Validate color format if provided
    if (color !== undefined && color !== null && color.trim().length > 0) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(color)) {
        throw new BadRequestError(
          'Color must be a valid hex color code (e.g., #FF5733)',
        );
      }
    }

    // Create tag
    const tag = await this.tagsRepository.create({
      name: name.trim(),
      slug: tagSlug,
      color: color && color.trim().length > 0 ? color : undefined,
      description:
        description && description.trim().length > 0 ? description : undefined,
    });

    return {
      tag: {
        id: tag.tagId.toString(),
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        description: tag.description,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      },
    };
  }
}
