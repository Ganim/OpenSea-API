import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { AssignTicketUseCase } from '../assign-ticket';

export function makeAssignTicketUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  return new AssignTicketUseCase(supportTicketsRepository);
}
