import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type SupportTicketDTO,
  supportTicketToDTO,
} from '@/mappers/core/support-ticket-mapper';
import {
  type SupportTicketMessageDTO,
  supportTicketMessageToDTO,
} from '@/mappers/core/support-ticket-message-mapper';
import {
  type SupportTicketAttachmentDTO,
  supportTicketAttachmentToDTO,
} from '@/mappers/core/support-ticket-attachment-mapper';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';
import type { SupportTicketMessagesRepository } from '@/repositories/core/support-ticket-messages-repository';
import type { SupportTicketAttachmentsRepository } from '@/repositories/core/support-ticket-attachments-repository';

interface GetTicketUseCaseRequest {
  ticketId: string;
}

interface GetTicketUseCaseResponse {
  ticket: SupportTicketDTO;
  messages: SupportTicketMessageDTO[];
  attachments: SupportTicketAttachmentDTO[];
}

export class GetTicketUseCase {
  constructor(
    private supportTicketsRepository: SupportTicketsRepository,
    private supportTicketMessagesRepository: SupportTicketMessagesRepository,
    private supportTicketAttachmentsRepository: SupportTicketAttachmentsRepository,
  ) {}

  async execute({
    ticketId,
  }: GetTicketUseCaseRequest): Promise<GetTicketUseCaseResponse> {
    const ticket = await this.supportTicketsRepository.findById(ticketId);

    if (!ticket) {
      throw new ResourceNotFoundError('Support ticket not found');
    }

    const [messages, attachments] = await Promise.all([
      this.supportTicketMessagesRepository.findByTicketId(ticketId),
      this.supportTicketAttachmentsRepository.findByTicketId(ticketId),
    ]);

    return {
      ticket: supportTicketToDTO(ticket),
      messages: messages.map(supportTicketMessageToDTO),
      attachments: attachments.map(supportTicketAttachmentToDTO),
    };
  }
}
