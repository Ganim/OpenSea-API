import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { UpdateTicketStatusUseCase } from '../update-ticket-status';

export function makeUpdateTicketStatusUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  return new UpdateTicketStatusUseCase(supportTicketsRepository);
}
