import { PrismaSupportTicketsRepository } from '@/repositories/core/prisma/prisma-support-tickets-repository';
import { GetSupportMetricsUseCase } from '../get-support-metrics';

export function makeGetSupportMetricsUseCase() {
  const supportTicketsRepository = new PrismaSupportTicketsRepository();
  return new GetSupportMetricsUseCase(supportTicketsRepository);
}
