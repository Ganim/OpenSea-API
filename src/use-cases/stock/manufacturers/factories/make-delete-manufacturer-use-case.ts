import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { DeleteManufacturerUseCase } from '@/use-cases/stock/manufacturers/delete-manufacturer';

export function makeDeleteManufacturerUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new DeleteManufacturerUseCase(manufacturersRepository);
}
