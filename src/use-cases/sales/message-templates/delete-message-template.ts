import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessageTemplatesRepository } from '@/repositories/sales/message-templates-repository';

interface DeleteMessageTemplateUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteMessageTemplateUseCaseResponse {
  message: string;
}

export class DeleteMessageTemplateUseCase {
  constructor(private messageTemplatesRepository: MessageTemplatesRepository) {}

  async execute(
    input: DeleteMessageTemplateUseCaseRequest,
  ): Promise<DeleteMessageTemplateUseCaseResponse> {
    const template = await this.messageTemplatesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Message template not found.');
    }

    template.delete();
    await this.messageTemplatesRepository.save(template);

    return {
      message: 'Message template deleted successfully.',
    };
  }
}
