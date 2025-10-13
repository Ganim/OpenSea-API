import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface ListTagsUseCaseResponse {
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export class ListTagsUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute(): Promise<ListTagsUseCaseResponse> {
    const tags = await this.tagsRepository.findMany();

    return {
      tags: tags.map((tag) => ({
        id: tag.tagId.toString(),
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        description: tag.description,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
      })),
    };
  }
}
