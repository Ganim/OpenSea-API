import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { RotateQrTokenUseCase } from '../rotate-qr-token';

export function makeRotateQrTokenUseCase() {
  return new RotateQrTokenUseCase(new PrismaEmployeesRepository());
}
