import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { ListTicketsUseCase } from '../list-tickets';

export function makeListTicketsUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  return new ListTicketsUseCase(supportTicketsRepository);
}
