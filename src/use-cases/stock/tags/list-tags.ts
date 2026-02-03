import type { TagDTO } from '@/mappers/stock/tag/tag-to-dto';
import { tagToDTO } from '@/mappers/stock/tag/tag-to-dto';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface ListTagsUseCaseRequest {
  tenantId: string;
}

interface ListTagsUseCaseResponse {
  tags: TagDTO[];
}

export class ListTagsUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute({
    tenantId,
  }: ListTagsUseCaseRequest): Promise<ListTagsUseCaseResponse> {
    const tags = await this.tagsRepository.findMany(tenantId);

    return {
      tags: tags.map(tagToDTO),
    };
  }
}
