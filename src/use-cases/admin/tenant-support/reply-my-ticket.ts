import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { SupportTicketMessage } from '@/entities/core/support-ticket-message';
import {
  type SupportTicketMessageDTO,
  supportTicketMessageToDTO,
} from '@/mappers/core/support-ticket-message-mapper';
import type { SupportTicketMessagesRepository } from '@/repositories/core/support-ticket-messages-repository';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface ReplyMyTicketUseCaseRequest {
  ticketId: string;
  tenantId: string;
  userId: string;
  body: string;
}

interface ReplyMyTicketUseCaseResponse {
  message: SupportTicketMessageDTO;
}

export class ReplyMyTicketUseCase {
  constructor(
    private supportTicketsRepository: SupportTicketsRepository,
    private supportTicketMessagesRepository: SupportTicketMessagesRepository,
  ) {}

  async execute({
    ticketId,
    tenantId,
    userId,
    body,
  }: ReplyMyTicketUseCaseRequest): Promise<ReplyMyTicketUseCaseResponse> {
    const ticket = await this.supportTicketsRepository.findById(ticketId);

    if (!ticket) {
      throw new ResourceNotFoundError('Support ticket not found');
    }

    if (ticket.tenantId !== tenantId || ticket.creatorId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to reply to this ticket',
      );
    }

    const ticketMessage = SupportTicketMessage.create({
      ticketId,
      authorId: userId,
      authorType: 'TENANT_USER',
      body,
      isInternal: false,
    });

    await this.supportTicketMessagesRepository.create(ticketMessage);

    // Reopen ticket if it was waiting for client response or resolved
    if (ticket.status === 'WAITING_CLIENT' || ticket.status === 'RESOLVED') {
      ticket.status = 'OPEN';
      await this.supportTicketsRepository.save(ticket);
    }

    return {
      message: supportTicketMessageToDTO(ticketMessage),
    };
  }
}
