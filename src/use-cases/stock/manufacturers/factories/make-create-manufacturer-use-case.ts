import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { CreateManufacturerUseCase } from '@/use-cases/stock/manufacturers/create-manufacturer';

export function makeCreateManufacturerUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new CreateManufacturerUseCase(manufacturersRepository);
}
