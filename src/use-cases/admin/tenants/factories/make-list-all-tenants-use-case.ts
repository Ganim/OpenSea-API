import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { ListAllTenantsUseCase } from '../list-all-tenants';

export function makeListAllTenantsUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  return new ListAllTenantsUseCase(tenantsRepository);
}
