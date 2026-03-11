import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { SetEmployeeOnLeaveUseCase } from '../set-employee-on-leave';

export function makeSetEmployeeOnLeaveUseCase(): SetEmployeeOnLeaveUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  return new SetEmployeeOnLeaveUseCase(employeesRepository);
}
