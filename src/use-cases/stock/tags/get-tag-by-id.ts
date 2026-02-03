import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TagDTO } from '@/mappers/stock/tag/tag-to-dto';
import { tagToDTO } from '@/mappers/stock/tag/tag-to-dto';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface GetTagByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetTagByIdUseCaseResponse {
  tag: TagDTO;
}

export class GetTagByIdUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute({
    tenantId,
    id,
  }: GetTagByIdUseCaseRequest): Promise<GetTagByIdUseCaseResponse> {
    const tag = await this.tagsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!tag) {
      throw new ResourceNotFoundError('Tag not found');
    }

    return {
      tag: tagToDTO(tag),
    };
  }
}
