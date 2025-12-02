import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TemplatesRepository } from '@/repositories/stock/templates-repository';

interface DeleteTemplateUseCaseRequest {
  id: string;
}

export class DeleteTemplateUseCase {
  constructor(private templatesRepository: TemplatesRepository) {}

  async execute(request: DeleteTemplateUseCaseRequest): Promise<void> {
    const { id } = request;

    const template = await this.templatesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!template) {
      throw new ResourceNotFoundError('Template not found');
    }

    await this.templatesRepository.delete(new UniqueEntityID(id));
  }
}
