import type { MessageTemplateDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { messageTemplateToDTO } from '@/mappers/sales/message-template/message-template-to-dto';
import { MessageTemplatesRepository } from '@/repositories/sales/message-templates-repository';

interface ListMessageTemplatesUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
}

interface ListMessageTemplatesUseCaseResponse {
  messageTemplates: MessageTemplateDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListMessageTemplatesUseCase {
  constructor(private messageTemplatesRepository: MessageTemplatesRepository) {}

  async execute(
    input: ListMessageTemplatesUseCaseRequest,
  ): Promise<ListMessageTemplatesUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [messageTemplates, total] = await Promise.all([
      this.messageTemplatesRepository.findMany(page, perPage, input.tenantId),
      this.messageTemplatesRepository.countByTenant(input.tenantId),
    ]);

    return {
      messageTemplates: messageTemplates.map(messageTemplateToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
