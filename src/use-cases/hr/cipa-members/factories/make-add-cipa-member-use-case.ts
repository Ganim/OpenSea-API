import { PrismaCipaMandatesRepository } from '@/repositories/hr/prisma/prisma-cipa-mandates-repository';
import { PrismaCipaMembersRepository } from '@/repositories/hr/prisma/prisma-cipa-members-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { AddCipaMemberUseCase } from '../add-cipa-member';

export function makeAddCipaMemberUseCase() {
  const cipaMembersRepository = new PrismaCipaMembersRepository();
  const cipaMandatesRepository = new PrismaCipaMandatesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new AddCipaMemberUseCase(
    cipaMembersRepository,
    cipaMandatesRepository,
    employeesRepository,
  );
}
