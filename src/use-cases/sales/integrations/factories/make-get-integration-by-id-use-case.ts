import { PrismaIntegrationsRepository } from '@/repositories/sales/prisma/prisma-integrations-repository';
import { GetIntegrationByIdUseCase } from '../get-integration-by-id';

export function makeGetIntegrationByIdUseCase() {
  const integrationsRepository = new PrismaIntegrationsRepository();
  return new GetIntegrationByIdUseCase(integrationsRepository);
}
