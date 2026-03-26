import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MessageTemplateDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { messageTemplateToDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { MessageTemplatesRepository } from '@/repositories/sales/message-templates-repository';

interface GetMessageTemplateByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetMessageTemplateByIdUseCaseResponse {
  messageTemplate: MessageTemplateDTO;
}

export class GetMessageTemplateByIdUseCase {
  constructor(private messageTemplatesRepository: MessageTemplatesRepository) {}

  async execute(
    input: GetMessageTemplateByIdUseCaseRequest,
  ): Promise<GetMessageTemplateByIdUseCaseResponse> {
    const template = await this.messageTemplatesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Message template not found.');
    }

    return {
      messageTemplate: messageTemplateToDTO(template),
    };
  }
}
