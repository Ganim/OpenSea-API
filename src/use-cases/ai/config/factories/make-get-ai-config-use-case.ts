import { PrismaAiTenantConfigRepository } from '@/repositories/ai/prisma/prisma-ai-tenant-config-repository';
import { GetAiConfigUseCase } from '../get-ai-config';

export function makeGetAiConfigUseCase() {
  const configRepository = new PrismaAiTenantConfigRepository();
  return new GetAiConfigUseCase(configRepository);
}
