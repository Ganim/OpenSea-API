import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { RequestSickLeaveUseCase } from '../request-sick-leave';

export function makeRequestSickLeaveUseCase(): RequestSickLeaveUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new RequestSickLeaveUseCase(absencesRepository, employeesRepository);
}
