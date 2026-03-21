import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { SupportTicketMessage } from '@/entities/core/support-ticket-message';
import type { SupportTicketMessagesRepository } from '@/repositories/core/support-ticket-messages-repository';
import type { SupportTicketsRepository } from '@/repositories/core/support-tickets-repository';

interface RateTicketUseCaseRequest {
  ticketId: string;
  tenantId: string;
  userId: string;
  rating: number;
  comment?: string;
}

interface RateTicketUseCaseResponse {
  success: boolean;
}

export class RateTicketUseCase {
  constructor(
    private supportTicketsRepository: SupportTicketsRepository,
    private supportTicketMessagesRepository: SupportTicketMessagesRepository,
  ) {}

  async execute({
    ticketId,
    tenantId,
    userId,
    rating,
    comment,
  }: RateTicketUseCaseRequest): Promise<RateTicketUseCaseResponse> {
    const ticket = await this.supportTicketsRepository.findById(ticketId);

    if (!ticket) {
      throw new ResourceNotFoundError('Support ticket not found');
    }

    if (ticket.tenantId !== tenantId || ticket.creatorId !== userId) {
      throw new ForbiddenError(
        'You do not have permission to rate this ticket',
      );
    }

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      throw new ForbiddenError(
        'You can only rate tickets that are resolved or closed',
      );
    }

    if (rating < 1 || rating > 5) {
      throw new ForbiddenError('Rating must be between 1 and 5');
    }

    // Store the rating as a special system message
    const ratingBody = comment
      ? `[RATING:${rating}] ${comment}`
      : `[RATING:${rating}]`;

    const ratingMessage = SupportTicketMessage.create({
      ticketId,
      authorId: userId,
      authorType: 'TENANT_USER',
      body: ratingBody,
      isInternal: false,
    });

    await this.supportTicketMessagesRepository.create(ratingMessage);

    return { success: true };
  }
}
