import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { SendKudosUseCase } from '../send-kudos';

export function makeSendKudosUseCase(): SendKudosUseCase {
  const employeeKudosRepository = new PrismaEmployeeKudosRepository();
  return new SendKudosUseCase(employeeKudosRepository);
}
