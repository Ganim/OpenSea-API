import type { TagDTO } from '@/mappers/stock/tag/tag-to-dto';
import { tagToDTO } from '@/mappers/stock/tag/tag-to-dto';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface ListTagsUseCaseResponse {
  tags: TagDTO[];
}

export class ListTagsUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute(): Promise<ListTagsUseCaseResponse> {
    const tags = await this.tagsRepository.findMany();

    return {
      tags: tags.map(tagToDTO),
    };
  }
}
