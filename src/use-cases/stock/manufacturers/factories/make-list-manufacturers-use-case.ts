import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { ListManufacturersUseCase } from '@/use-cases/stock/manufacturers/list-manufacturers';

export function makeListManufacturersUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new ListManufacturersUseCase(manufacturersRepository);
}
