import { PrismaAdmissionsRepository } from '@/repositories/hr/prisma/prisma-admissions-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { ApproveAdmissionUseCase } from '../approve-admission';

export function makeApproveAdmissionUseCase(): ApproveAdmissionUseCase {
  const admissionsRepository = new PrismaAdmissionsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new ApproveAdmissionUseCase(admissionsRepository, employeesRepository);
}
