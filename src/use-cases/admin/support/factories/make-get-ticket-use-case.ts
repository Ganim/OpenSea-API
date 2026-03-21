import { PrismaSupportTicketAttachmentsRepository } from '@/repositories/core/prisma/prisma-support-ticket-attachments-repository';
import { PrismaSupportTicketMessagesRepository } from '@/repositories/core/prisma/prisma-support-ticket-messages-repository';
import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { GetTicketUseCase } from '../get-ticket';

export function makeGetTicketUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  const supportTicketMessagesRepository =
    new PrismaSupportTicketMessagesRepository();
  const supportTicketAttachmentsRepository =
    new PrismaSupportTicketAttachmentsRepository();
  return new GetTicketUseCase(
    supportTicketsRepository,
    supportTicketMessagesRepository,
    supportTicketAttachmentsRepository,
  );
}
