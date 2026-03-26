import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MessageTemplateDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { messageTemplateToDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { MessageTemplatesRepository } from '@/repositories/sales/message-templates-repository';

interface DuplicateMessageTemplateUseCaseRequest {
  tenantId: string;
  id: string;
  createdBy: string;
}

interface DuplicateMessageTemplateUseCaseResponse {
  messageTemplate: MessageTemplateDTO;
}

export class DuplicateMessageTemplateUseCase {
  constructor(private messageTemplatesRepository: MessageTemplatesRepository) {}

  async execute(
    input: DuplicateMessageTemplateUseCaseRequest,
  ): Promise<DuplicateMessageTemplateUseCaseResponse> {
    const sourceTemplate = await this.messageTemplatesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!sourceTemplate) {
      throw new ResourceNotFoundError('Message template not found.');
    }

    // Generate unique name
    let duplicatedName = `${sourceTemplate.name} (copy)`;
    let counter = 1;
    while (await this.messageTemplatesRepository.findByName(duplicatedName, input.tenantId)) {
      counter++;
      duplicatedName = `${sourceTemplate.name} (copy ${counter})`;
    }

    const duplicatedTemplate = await this.messageTemplatesRepository.create({
      tenantId: input.tenantId,
      name: duplicatedName,
      channel: sourceTemplate.channel,
      subject: sourceTemplate.subject,
      body: sourceTemplate.body,
      variables: [...sourceTemplate.variables],
      isActive: false, // Duplicated templates start inactive
      createdBy: input.createdBy,
    });

    return {
      messageTemplate: messageTemplateToDTO(duplicatedTemplate),
    };
  }
}
