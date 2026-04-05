import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { ListPrintersUseCase } from '../list-printers.use-case';

export function makeListPrintersUseCase() {
  return new ListPrintersUseCase(new PrismaPosPrintersRepository());
}
