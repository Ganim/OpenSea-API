import { PrismaAiTenantConfigRepository } from '@/repositories/ai/prisma/prisma-ai-tenant-config-repository';
import { UpdateAiConfigUseCase } from '../update-ai-config';

export function makeUpdateAiConfigUseCase() {
  const configRepository = new PrismaAiTenantConfigRepository();
  return new UpdateAiConfigUseCase(configRepository);
}
