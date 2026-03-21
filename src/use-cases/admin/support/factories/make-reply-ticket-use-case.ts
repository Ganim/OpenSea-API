import { PrismaSupportTicketMessagesRepository } from '@/repositories/core/prisma/prisma-support-ticket-messages-repository';
import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { ReplyTicketUseCase } from '../reply-ticket';

export function makeReplyTicketUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  const supportTicketMessagesRepository =
    new PrismaSupportTicketMessagesRepository();
  return new ReplyTicketUseCase(
    supportTicketsRepository,
    supportTicketMessagesRepository,
  );
}
