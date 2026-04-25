import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { RegenerateShortIdUseCase } from '../regenerate-short-id';

export function makeRegenerateShortIdUseCase(): RegenerateShortIdUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  return new RegenerateShortIdUseCase(employeesRepository);
}
