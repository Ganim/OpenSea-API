import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { DeletePrinterUseCase } from '../delete-printer.use-case';

export function makeDeletePrinterUseCase() {
  return new DeletePrinterUseCase(new PrismaPosPrintersRepository());
}
