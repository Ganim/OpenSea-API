import { PrismaCommissionsRepository } from '@/repositories/sales/prisma/prisma-commissions-repository';
import { ListCommissionsUseCase } from '../list-commissions';

export function makeListCommissionsUseCase() {
  const commissionsRepository = new PrismaCommissionsRepository();
  return new ListCommissionsUseCase(commissionsRepository);
}
