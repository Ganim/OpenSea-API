import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { RotateQrTokensBulkUseCase } from '../rotate-qr-tokens-bulk';

export function makeRotateQrTokensBulkUseCase() {
  return new RotateQrTokensBulkUseCase(new PrismaEmployeesRepository());
}
