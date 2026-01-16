import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplatesRepository } from '@/repositories/core/label-templates-repository';

interface DeleteLabelTemplateUseCaseRequest {
  id: string;
}

export class DeleteLabelTemplateUseCase {
  constructor(private labelTemplatesRepository: LabelTemplatesRepository) {}

  async execute(request: DeleteLabelTemplateUseCaseRequest): Promise<void> {
    const { id } = request;

    const templateId = new UniqueEntityID(id);
    const existingTemplate =
      await this.labelTemplatesRepository.findById(templateId);

    if (!existingTemplate) {
      throw new ResourceNotFoundError('Label template not found');
    }

    if (existingTemplate.isSystem) {
      throw new BadRequestError('Cannot delete system templates');
    }

    await this.labelTemplatesRepository.delete(templateId);
  }
}
