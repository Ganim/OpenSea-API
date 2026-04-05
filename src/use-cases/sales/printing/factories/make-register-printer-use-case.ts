import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { RegisterPrinterUseCase } from '../register-printer.use-case';

export function makeRegisterPrinterUseCase() {
  return new RegisterPrinterUseCase(
    new PrismaTenantsRepository(),
    new PrismaPosPrintersRepository(),
  );
}
