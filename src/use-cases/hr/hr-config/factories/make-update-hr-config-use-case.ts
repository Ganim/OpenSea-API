import { PrismaHrTenantConfigRepository } from '@/repositories/hr/prisma/prisma-hr-tenant-config-repository';
import { UpdateHrConfigUseCase } from '../update-hr-config';

export function makeUpdateHrConfigUseCase(): UpdateHrConfigUseCase {
  const hrConfigRepository = new PrismaHrTenantConfigRepository();
  return new UpdateHrConfigUseCase(hrConfigRepository);
}
