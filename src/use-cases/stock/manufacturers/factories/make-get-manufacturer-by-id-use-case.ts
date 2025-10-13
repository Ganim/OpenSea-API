import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { GetManufacturerByIdUseCase } from '@/use-cases/stock/manufacturers/get-manufacturer-by-id';

export function makeGetManufacturerByIdUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new GetManufacturerByIdUseCase(manufacturersRepository);
}
