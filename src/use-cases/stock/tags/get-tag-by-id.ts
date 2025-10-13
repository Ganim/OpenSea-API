import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface GetTagByIdUseCaseRequest {
  id: string;
}

interface GetTagByIdUseCaseResponse {
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

export class GetTagByIdUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute({
    id,
  }: GetTagByIdUseCaseRequest): Promise<GetTagByIdUseCaseResponse> {
    const tag = await this.tagsRepository.findById(new UniqueEntityID(id));

    if (!tag) {
      throw new ResourceNotFoundError('Tag not found');
    }

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
