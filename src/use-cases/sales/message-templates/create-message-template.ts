import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { MessageTemplate, type MessageChannelType } from '@/entities/sales/message-template';
import type { MessageTemplateDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { messageTemplateToDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { MessageTemplatesRepository } from '@/repositories/sales/message-templates-repository';

interface CreateMessageTemplateUseCaseRequest {
  tenantId: string;
  name: string;
  channel: MessageChannelType;
  subject?: string;
  body: string;
  isActive?: boolean;
  createdBy: string;
}

interface CreateMessageTemplateUseCaseResponse {
  messageTemplate: MessageTemplateDTO;
}

const VALID_CHANNELS: MessageChannelType[] = ['EMAIL', 'WHATSAPP', 'SMS', 'NOTIFICATION'];

export class CreateMessageTemplateUseCase {
  constructor(private messageTemplatesRepository: MessageTemplatesRepository) {}

  async execute(
    input: CreateMessageTemplateUseCaseRequest,
  ): Promise<CreateMessageTemplateUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Template name is required.');
    }

    if (input.name.length > 255) {
      throw new BadRequestError('Template name cannot exceed 255 characters.');
    }

    if (!VALID_CHANNELS.includes(input.channel)) {
      throw new BadRequestError(`Invalid channel: ${input.channel}.`);
    }

    if (!input.body || input.body.trim().length === 0) {
      throw new BadRequestError('Template body is required.');
    }

    if (input.subject && input.subject.length > 500) {
      throw new BadRequestError('Subject cannot exceed 500 characters.');
    }

    // Check for duplicate name in tenant
    const existingTemplate = await this.messageTemplatesRepository.findByName(
      input.name.trim(),
      input.tenantId,
    );
    if (existingTemplate) {
      throw new BadRequestError('A template with this name already exists.');
    }

    // Extract variables from body
    const variables = MessageTemplate.extractVariables(input.body);

    const messageTemplate = await this.messageTemplatesRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      channel: input.channel,
      subject: input.subject,
      body: input.body,
      variables,
      isActive: input.isActive,
      createdBy: input.createdBy,
    });

    return {
      messageTemplate: messageTemplateToDTO(messageTemplate),
    };
  }
}
