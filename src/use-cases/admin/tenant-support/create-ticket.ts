import {
  SupportTicket,
  type TicketCategory,
} from '@/entities/core/support-ticket';
import { SupportTicketMessage } from '@/entities/core/support-ticket-message';
import {
  type SupportTicketDTO,
  supportTicketToDTO,
} from '@/mappers/core/support-ticket-mapper';
import type { SupportTicketMessagesRepository } from '@/repositories/core/support-ticket-messages-repository';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface CreateTicketUseCaseRequest {
  tenantId: string;
  creatorId: string;
  title: string;
  description: string;
  category?: TicketCategory;
}

interface CreateTicketUseCaseResponse {
  ticket: SupportTicketDTO;
}

export class CreateTicketUseCase {
  constructor(
    private supportTicketsRepository: SupportTicketsRepository,
    private supportTicketMessagesRepository: SupportTicketMessagesRepository,
  ) {}

  async execute({
    tenantId,
    creatorId,
    title,
    description,
    category,
  }: CreateTicketUseCaseRequest): Promise<CreateTicketUseCaseResponse> {
    const ticket = SupportTicket.create({
      tenantId,
      creatorId,
      title,
      category,
    });

    const createdTicket = await this.supportTicketsRepository.create(ticket);

    // Create the initial message with the description
    const initialMessage = SupportTicketMessage.create({
      ticketId: createdTicket.supportTicketId.toString(),
      authorId: creatorId,
      authorType: 'TENANT_USER',
      body: description,
    });

    await this.supportTicketMessagesRepository.create(initialMessage);

    return {
      ticket: supportTicketToDTO(createdTicket),
    };
  }
}
