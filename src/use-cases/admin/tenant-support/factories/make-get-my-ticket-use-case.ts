import { PrismaSupportTicketAttachmentsRepository } from '@/repositories/core/prisma/prisma-support-ticket-attachments-repository';
import { PrismaSupportTicketMessagesRepository } from '@/repositories/core/prisma/prisma-support-ticket-messages-repository';
import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { GetMyTicketUseCase } from '../get-my-ticket';

export function makeGetMyTicketUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  const supportTicketMessagesRepository =
    new PrismaSupportTicketMessagesRepository();
  const supportTicketAttachmentsRepository =
    new PrismaSupportTicketAttachmentsRepository();
  return new GetMyTicketUseCase(
    supportTicketsRepository,
    supportTicketMessagesRepository,
    supportTicketAttachmentsRepository,
  );
}
