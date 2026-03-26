import { PrismaHrTenantConfigRepository } from '@/repositories/hr/prisma/prisma-hr-tenant-config-repository';
import { GetHrConfigUseCase } from '../get-hr-config';

export function makeGetHrConfigUseCase(): GetHrConfigUseCase {
  const hrConfigRepository = new PrismaHrTenantConfigRepository();
  return new GetHrConfigUseCase(hrConfigRepository);
}
