import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessageTemplatesRepository } from '@/repositories/sales/message-templates-repository';

interface PreviewMessageTemplateUseCaseRequest {
  tenantId: string;
  id: string;
  sampleData: Record<string, string>;
}

interface PreviewMessageTemplateUseCaseResponse {
  templateName: string;
  channel: string;
  subject?: string;
  renderedBody: string;
  variables: string[];
}

export class PreviewMessageTemplateUseCase {
  constructor(private messageTemplatesRepository: MessageTemplatesRepository) {}

  async execute(
    input: PreviewMessageTemplateUseCaseRequest,
  ): Promise<PreviewMessageTemplateUseCaseResponse> {
    const template = await this.messageTemplatesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!template) {
      throw new ResourceNotFoundError('Message template not found.');
    }

    const renderedBody = template.renderPreview(input.sampleData);

    // Also render subject if present
    let renderedSubject: string | undefined;
    if (template.subject) {
      renderedSubject = template.subject.replace(
        /\{\{(\w+)\}\}/g,
        (match, key) => {
          return input.sampleData[key] ?? match;
        },
      );
    }

    return {
      templateName: template.name,
      channel: template.channel,
      subject: renderedSubject,
      renderedBody,
      variables: template.variables,
    };
  }
}
