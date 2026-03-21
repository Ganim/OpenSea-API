import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { ListMyTicketsUseCase } from '../list-my-tickets';

export function makeListMyTicketsUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  return new ListMyTicketsUseCase(supportTicketsRepository);
}
