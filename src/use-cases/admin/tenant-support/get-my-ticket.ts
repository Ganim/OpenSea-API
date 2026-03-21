import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
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

interface GetMyTicketUseCaseRequest {
  ticketId: string;
  tenantId: string;
  userId: string;
}

interface GetMyTicketUseCaseResponse {
  ticket: SupportTicketDTO;
  messages: SupportTicketMessageDTO[];
  attachments: SupportTicketAttachmentDTO[];
}

export class GetMyTicketUseCase {
  constructor(
    private supportTicketsRepository: SupportTicketsRepository,
    private supportTicketMessagesRepository: SupportTicketMessagesRepository,
    private supportTicketAttachmentsRepository: SupportTicketAttachmentsRepository,
  ) {}

  async execute({
    ticketId,
    tenantId,
    userId,
  }: GetMyTicketUseCaseRequest): Promise<GetMyTicketUseCaseResponse> {
    const ticket = await this.supportTicketsRepository.findById(ticketId);

    if (!ticket) {
      throw new ResourceNotFoundError('Support ticket not found');
    }

    if (ticket.tenantId !== tenantId || ticket.creatorId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to view this ticket',
      );
    }

    const [allMessages, attachments] = await Promise.all([
      this.supportTicketMessagesRepository.findByTicketId(ticketId),
      this.supportTicketAttachmentsRepository.findByTicketId(ticketId),
    ]);

    // Exclude internal messages from tenant view
    const visibleMessages = allMessages.filter(
      (message) => !message.isInternal,
    );

    return {
      ticket: supportTicketToDTO(ticket),
      messages: visibleMessages.map(supportTicketMessageToDTO),
      attachments: attachments.map(supportTicketAttachmentToDTO),
    };
  }
}
