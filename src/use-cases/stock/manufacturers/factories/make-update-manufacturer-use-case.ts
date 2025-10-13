import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { UpdateManufacturerUseCase } from '@/use-cases/stock/manufacturers/update-manufacturer';

export function makeUpdateManufacturerUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new UpdateManufacturerUseCase(manufacturersRepository);
}
