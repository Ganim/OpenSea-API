import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SupportTicketMessage } from '@/entities/core/support-ticket-message';
import {
  type SupportTicketMessageDTO,
  supportTicketMessageToDTO,
} from '@/mappers/core/support-ticket-message-mapper';
import type { SupportTicketMessagesRepository } from '@/repositories/core/support-ticket-messages-repository';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface ReplyTicketUseCaseRequest {
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
}

interface ReplyTicketUseCaseResponse {
  message: SupportTicketMessageDTO;
}

export class ReplyTicketUseCase {
  constructor(
    private supportTicketsRepository: SupportTicketsRepository,
    private supportTicketMessagesRepository: SupportTicketMessagesRepository,
  ) {}

  async execute({
    ticketId,
    authorId,
    body,
    isInternal,
  }: ReplyTicketUseCaseRequest): Promise<ReplyTicketUseCaseResponse> {
    const ticket = await this.supportTicketsRepository.findById(ticketId);

    if (!ticket) {
      throw new ResourceNotFoundError('Support ticket not found');
    }

    const ticketMessage = SupportTicketMessage.create({
      ticketId,
      authorId,
      authorType: 'CENTRAL_TEAM',
      body,
      isInternal,
    });

    await this.supportTicketMessagesRepository.create(ticketMessage);

    // If ticket was waiting on client response, move to in progress
    if (ticket.status === 'WAITING_CLIENT') {
      ticket.status = 'IN_PROGRESS';
      await this.supportTicketsRepository.save(ticket);
    }

    return {
      message: supportTicketMessageToDTO(ticketMessage),
    };
  }
}
