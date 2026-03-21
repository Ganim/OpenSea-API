import { PrismaSupportTicketMessagesRepository } from '@/repositories/core/prisma/prisma-support-ticket-messages-repository';
import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { ReplyMyTicketUseCase } from '../reply-my-ticket';

export function makeReplyMyTicketUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  const supportTicketMessagesRepository =
    new PrismaSupportTicketMessagesRepository();
  return new ReplyMyTicketUseCase(
    supportTicketsRepository,
    supportTicketMessagesRepository,
  );
}
