import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TicketStatus } from '@/entities/core/support-ticket';
import {
  type SupportTicketDTO,
  supportTicketToDTO,
} from '@/mappers/core/support-ticket-mapper';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface UpdateTicketStatusUseCaseRequest {
  ticketId: string;
  status: TicketStatus;
}

interface UpdateTicketStatusUseCaseResponse {
  ticket: SupportTicketDTO;
}

export class UpdateTicketStatusUseCase {
  constructor(private supportTicketsRepository: SupportTicketsRepository) {}

  async execute({
    ticketId,
    status,
  }: UpdateTicketStatusUseCaseRequest): Promise<UpdateTicketStatusUseCaseResponse> {
    const ticket = await this.supportTicketsRepository.findById(ticketId);

    if (!ticket) {
      throw new ResourceNotFoundError('Support ticket not found');
    }

    ticket.status = status;

    if (status === 'RESOLVED' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }

    if (status === 'CLOSED' && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    await this.supportTicketsRepository.save(ticket);

    return {
      ticket: supportTicketToDTO(ticket),
    };
  }
}
