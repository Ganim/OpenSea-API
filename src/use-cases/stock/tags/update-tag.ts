import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TagDTO } from '@/mappers/stock/tag/tag-to-dto';
import { tagToDTO } from '@/mappers/stock/tag/tag-to-dto';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface UpdateTagUseCaseRequest {
  id: string;
  name?: string;
  slug?: string;
  color?: string;
  description?: string;
}

interface UpdateTagUseCaseResponse {
  tag: TagDTO;
}

export class UpdateTagUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute({
    id,
    name,
    slug,
    color,
    description,
  }: UpdateTagUseCaseRequest): Promise<UpdateTagUseCaseResponse> {
    // Check if tag exists
    const tag = await this.tagsRepository.findById(new UniqueEntityID(id));
    if (!tag) {
      throw new ResourceNotFoundError('Tag not found');
    }

    // Validate name if provided
    if (name !== undefined) {
      if (name.trim().length === 0) {
        throw new BadRequestError('Tag name cannot be empty');
      }

      if (name.length > 100) {
        throw new BadRequestError('Tag name must be at most 100 characters');
      }

      // Check if name is already in use by another tag
      if (name !== tag.name) {
        const tagWithSameName = await this.tagsRepository.findByName(name);
        if (tagWithSameName) {
          throw new BadRequestError('A tag with this name already exists');
        }
      }
    }

    // Validate slug if provided
    if (slug !== undefined) {
      if (slug.length > 100) {
        throw new BadRequestError('Tag slug must be at most 100 characters');
      }

      // Check if slug is already in use by another tag
      if (slug !== tag.slug) {
        const tagWithSameSlug = await this.tagsRepository.findBySlug(slug);
        if (tagWithSameSlug) {
          throw new BadRequestError('A tag with this slug already exists');
        }
      }
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

    // Update tag
    const updatedTag = await this.tagsRepository.update({
      id: new UniqueEntityID(id),
      name: name?.trim(),
      slug,
      color: color !== undefined && color.trim().length > 0 ? color : undefined,
      description:
        description !== undefined && description.trim().length > 0
          ? description
          : undefined,
    });

    if (!updatedTag) {
      throw new ResourceNotFoundError('Tag not found');
    }

    return {
      tag: tagToDTO(updatedTag),
    };
  }
}
