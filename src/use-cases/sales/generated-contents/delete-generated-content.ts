import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeneratedContentsRepository } from '@/repositories/sales/generated-contents-repository';

interface DeleteGeneratedContentUseCaseRequest {
  contentId: string;
  tenantId: string;
}

export class DeleteGeneratedContentUseCase {
  constructor(
    private generatedContentsRepository: GeneratedContentsRepository,
  ) {}

  async execute(request: DeleteGeneratedContentUseCaseRequest): Promise<void> {
    const content = await this.generatedContentsRepository.findById(
      new UniqueEntityID(request.contentId),
      request.tenantId,
    );

    if (!content) {
      throw new ResourceNotFoundError('Content not found');
    }

    content.delete();
    await this.generatedContentsRepository.save(content);
  }
}
