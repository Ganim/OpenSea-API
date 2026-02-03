import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TagsRepository } from '@/repositories/stock/tags-repository';

interface DeleteTagUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteTagUseCase {
  constructor(private tagsRepository: TagsRepository) {}

  async execute({ tenantId, id }: DeleteTagUseCaseRequest): Promise<void> {
    const tag = await this.tagsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!tag) {
      throw new ResourceNotFoundError('Tag not found');
    }

    await this.tagsRepository.delete(new UniqueEntityID(id));
  }
}
