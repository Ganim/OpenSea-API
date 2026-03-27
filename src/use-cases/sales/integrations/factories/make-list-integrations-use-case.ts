import { PrismaIntegrationsRepository } from '@/repositories/sales/prisma/prisma-integrations-repository';
import { ListIntegrationsUseCase } from '../list-integrations';

export function makeListIntegrationsUseCase() {
  const integrationsRepository = new PrismaIntegrationsRepository();
  return new ListIntegrationsUseCase(integrationsRepository);
}
