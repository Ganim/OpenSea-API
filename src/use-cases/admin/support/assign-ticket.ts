import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type SupportTicketDTO,
  supportTicketToDTO,
} from '@/mappers/core/support-ticket-mapper';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface AssignTicketUseCaseRequest {
  ticketId: string;
  assigneeId: string;
}

interface AssignTicketUseCaseResponse {
  ticket: SupportTicketDTO;
}

export class AssignTicketUseCase {
  constructor(private supportTicketsRepository: SupportTicketsRepository) {}

  async execute({
    ticketId,
    assigneeId,
  }: AssignTicketUseCaseRequest): Promise<AssignTicketUseCaseResponse> {
    const ticket = await this.supportTicketsRepository.findById(ticketId);

    if (!ticket) {
      throw new ResourceNotFoundError('Support ticket not found');
    }

    ticket.assign(assigneeId);

    await this.supportTicketsRepository.save(ticket);

    return {
      ticket: supportTicketToDTO(ticket),
    };
  }
}
