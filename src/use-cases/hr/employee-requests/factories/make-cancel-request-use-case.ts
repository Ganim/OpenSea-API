import { PrismaEmployeeRequestsRepository } from '@/repositories/hr/prisma/prisma-employee-requests-repository';
import { CancelRequestUseCase } from '../cancel-request';

export function makeCancelRequestUseCase(): CancelRequestUseCase {
  const employeeRequestsRepository = new PrismaEmployeeRequestsRepository();
  return new CancelRequestUseCase(employeeRequestsRepository);
}
