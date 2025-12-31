import { PrismaManufacturersRepository } from '@/repositories/hr/prisma/prisma-manufacturers-repository';
import { CreateManufacturerUseCase } from '../create-manufacturer';
import { GetManufacturerByIdUseCase } from '../get-manufacturer-by-id';
import { ListManufacturersUseCase } from '../list-manufacturers';
import { UpdateManufacturerUseCase } from '../update-manufacturer';
import { DeleteManufacturerUseCase } from '../delete-manufacturer';

export function makeCreateManufacturerUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new CreateManufacturerUseCase(manufacturersRepository);
}

export function makeGetManufacturerByIdUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new GetManufacturerByIdUseCase(manufacturersRepository);
}

export function makeListManufacturersUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new ListManufacturersUseCase(manufacturersRepository);
}

export function makeUpdateManufacturerUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new UpdateManufacturerUseCase(manufacturersRepository);
}

export function makeDeleteManufacturerUseCase() {
  const manufacturersRepository = new PrismaManufacturersRepository();
  return new DeleteManufacturerUseCase(manufacturersRepository);
}
