import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { type MessageChannelType } from '@/entities/sales/message-template';
import type { MessageTemplateDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { messageTemplateToDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { MessageTemplatesRepository } from '@/repositories/sales/message-templates-repository';

interface UpdateMessageTemplateUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  channel?: MessageChannelType;
  subject?: string;
  body?: string;
  isActive?: boolean;
}

interface UpdateMessageTemplateUseCaseResponse {
  messageTemplate: MessageTemplateDTO;
}

const VALID_CHANNELS: MessageChannelType[] = [
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'NOTIFICATION',
];

export class UpdateMessageTemplateUseCase {
  constructor(private messageTemplatesRepository: MessageTemplatesRepository) {}

  async execute(
    input: UpdateMessageTemplateUseCaseRequest,
  ): Promise<UpdateMessageTemplateUseCaseResponse> {
    const template = await this.messageTemplatesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Message template not found.');
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new BadRequestError('Template name cannot be empty.');
      }
      if (input.name.length > 255) {
        throw new BadRequestError(
          'Template name cannot exceed 255 characters.',
        );
      }

      // Check for duplicate name (excluding self)
      const existingTemplate = await this.messageTemplatesRepository.findByName(
        input.name.trim(),
        input.tenantId,
      );
      if (existingTemplate && !existingTemplate.id.equals(template.id)) {
        throw new BadRequestError('A template with this name already exists.');
      }

      template.name = input.name.trim();
    }

    if (input.channel !== undefined) {
      if (!VALID_CHANNELS.includes(input.channel)) {
        throw new BadRequestError(`Invalid channel: ${input.channel}.`);
      }
      template.channel = input.channel;
    }

    if (input.subject !== undefined) {
      if (input.subject.length > 500) {
        throw new BadRequestError('Subject cannot exceed 500 characters.');
      }
      template.subject = input.subject || undefined;
    }

    if (input.body !== undefined) {
      if (input.body.trim().length === 0) {
        throw new BadRequestError('Template body cannot be empty.');
      }
      // Setting body auto-extracts variables via the entity setter
      template.body = input.body;
    }

    if (input.isActive !== undefined) {
      template.isActive = input.isActive;
    }

    await this.messageTemplatesRepository.save(template);

    return {
      messageTemplate: messageTemplateToDTO(template),
    };
  }
}
