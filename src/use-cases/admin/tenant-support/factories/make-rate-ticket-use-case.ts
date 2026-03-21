import { PrismaSupportTicketMessagesRepository } from '@/repositories/core/prisma/prisma-support-ticket-messages-repository';
import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { RateTicketUseCase } from '../rate-ticket';

export function makeRateTicketUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  const supportTicketMessagesRepository =
    new PrismaSupportTicketMessagesRepository();
  return new RateTicketUseCase(
    supportTicketsRepository,
    supportTicketMessagesRepository,
  );
}
